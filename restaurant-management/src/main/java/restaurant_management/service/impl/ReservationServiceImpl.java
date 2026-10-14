package restaurant_management.service.impl;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant_management.dto.CreateReservationRequest;
import restaurant_management.dto.ReservationRecipeRequest;
import restaurant_management.entity.*;
import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.ReservationStatus;
import restaurant_management.enums.Role;
import restaurant_management.repository.RecipeRepository;
import restaurant_management.repository.ReservationRepository;
import restaurant_management.repository.RestaurantTableRepository;
import restaurant_management.repository.UserRepository;
import restaurant_management.service.OrderService;
import restaurant_management.service.ReservationService;
import restaurant_management.service.RecipeService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ReservationServiceImpl implements ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RestaurantTableRepository tableRepository;
    private final RecipeRepository recipeRepository;
    private final OrderService orderService;
    private final RecipeService recipeService;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                   UserRepository userRepository,
                                   RestaurantTableRepository tableRepository,
                                   RecipeRepository recipeRepository,
                                   OrderService orderService,
                                   RecipeService recipeService) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.tableRepository = tableRepository;
        this.recipeRepository = recipeRepository;
        this.orderService = orderService;
        this.recipeService = recipeService;
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) throw new SecurityException("Authentication required");
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found"));
    }

    private void requireStaffOrManager() {
        User user = currentUser();
        if (user.getRole() != Role.STAFF && user.getRole() != Role.MANAGER) throw new SecurityException("Staff or manager access required");
    }

    @Override
    public Reservation createCustomerReservation(CreateReservationRequest request) {
        User customer = currentUser();
        if (customer.getRole() != Role.CUSTOMER) throw new SecurityException("Only customers can create reservations");
        if (request == null || request.getTableId() == null) throw new IllegalArgumentException("Table is required");
        if (request.getReservationDateTime() == null || !request.getReservationDateTime().isAfter(LocalDateTime.now())) throw new IllegalArgumentException("Reservation must be in the future");
        if (request.getGuestCount() == null || request.getGuestCount() <= 0) throw new IllegalArgumentException("Guest count must be greater than zero");

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        if (table.getCapacity() < request.getGuestCount()) throw new IllegalArgumentException("Guest count exceeds table capacity");

        LocalDateTime from = request.getReservationDateTime().minusHours(2);
        LocalDateTime to = request.getReservationDateTime().plusHours(2);
        if (reservationRepository.existsConflictingReservation(table.getId(), from, to,
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED))) {
            throw new IllegalArgumentException("This table is already reserved around the selected time");
        }

        Reservation reservation = new Reservation();
        reservation.setCustomer(customer);
        reservation.setRestaurantTable(table);
        reservation.setReservationDateTime(request.getReservationDateTime());
        reservation.setGuestCount(request.getGuestCount());
        reservation.setNote(request.getNote());
        reservation.setStatus(ReservationStatus.PENDING);

        List<ReservationItem> reservationItems = new ArrayList<>();
        for (ReservationRecipeRequest itemRequest : request.getItems() == null ? List.<ReservationRecipeRequest>of() : request.getItems()) {
            Recipe recipe = recipeRepository.findById(itemRequest.getRecipeId())
                    .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + itemRequest.getRecipeId()));
            if (!Boolean.TRUE.equals(recipe.getAvailable())) throw new IllegalArgumentException("Recipe is unavailable: " + recipe.getName());
            int units = recipeService.getAvailableUnits(recipe.getId());
            if (itemRequest.getQuantity() > units) throw new IllegalArgumentException("Only " + units + " unit(s) of " + recipe.getName() + " are currently available");
            BigDecimal unitPrice = recipe.calculateDiscountedPrice();
            reservationItems.add(ReservationItem.builder()
                    .reservation(reservation)
                    .recipe(recipe)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())))
                    .build());
        }
        reservation.setItems(reservationItems);
        return reservationRepository.save(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> getCurrentCustomerReservations() {
        return reservationRepository.findByCustomerIdOrderByReservationDateTimeDesc(currentUser().getId());
    }

    @Override
    public Reservation cancelCustomerReservation(Long id) {
        User customer = currentUser();
        Reservation reservation = reservationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        if (reservation.getCustomer() == null || !reservation.getCustomer().getId().equals(customer.getId())) throw new SecurityException("You are not allowed to cancel this reservation");
        if (reservation.getStatus() == ReservationStatus.COMPLETED) throw new IllegalArgumentException("Completed reservation cannot be cancelled");
        if (reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.REJECTED) return reservation;
        // Keep reservation and linked order/stock changes atomic. If cancelling the
        // order fails, let the transaction roll back instead of silently cancelling
        // only the reservation while leaving stock consumed.
        if (reservation.getOrder() != null) {
            OrderStatus orderStatus = reservation.getOrder().getStatus();
            if (orderStatus != OrderStatus.COMPLETED && orderStatus != OrderStatus.CANCELLED) {
                orderService.updateOrderStatus(reservation.getOrder().getId(), OrderStatus.CANCELLED);
            }
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationRepository.save(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> getAllReservationsForStaff() {
        requireStaffOrManager();
        return reservationRepository.findAllByOrderByReservationDateTimeAsc();
    }

    @Override
    public Reservation confirmReservation(Long id) {
        requireStaffOrManager();
        Reservation reservation = reservationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        if (reservation.getStatus() != ReservationStatus.PENDING) throw new IllegalArgumentException("Only pending reservation requests can be confirmed");

        LocalDateTime from = reservation.getReservationDateTime().minusHours(2);
        LocalDateTime to = reservation.getReservationDateTime().plusHours(2);
        if (reservationRepository.existsConflictingReservationExcept(reservation.getRestaurantTable().getId(), reservation.getId(), from, to,
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED))) {
            throw new IllegalArgumentException("This table has another pending or confirmed reservation around this time");
        }

        if (reservation.getItems() != null && !reservation.getItems().isEmpty()) {
            List<OrderItem> orderItems = reservation.getItems().stream().map(item -> {
                OrderItem oi = new OrderItem();
                oi.setRecipe(item.getRecipe());
                oi.setQuantity(item.getQuantity());
                return oi;
            }).toList();
            Order orderDraft = new Order();
            orderDraft.setCustomer(reservation.getCustomer());
            orderDraft.setRestaurantTable(reservation.getRestaurantTable());
            Order savedOrder = orderService.createReservationOrder(orderDraft, orderItems);
            reservation.setOrder(savedOrder);
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        return reservationRepository.save(reservation);
    }

    @Override
    public Reservation rejectReservation(Long id) {
        requireStaffOrManager();
        Reservation reservation = reservationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        if (reservation.getStatus() != ReservationStatus.PENDING) throw new IllegalArgumentException("Only pending reservation requests can be rejected");
        reservation.setStatus(ReservationStatus.REJECTED);
        return reservationRepository.save(reservation);
    }
}
