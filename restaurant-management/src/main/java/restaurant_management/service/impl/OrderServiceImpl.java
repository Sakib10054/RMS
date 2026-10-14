package restaurant_management.service.impl;

import restaurant_management.entity.*;
import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.OrderType;
import restaurant_management.enums.Role;
import restaurant_management.enums.TableStatus;
import restaurant_management.repository.*;
import restaurant_management.service.InventoryService;
import restaurant_management.service.PaymentService;
import restaurant_management.service.OrderService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            RecipeRepository recipeRepository,
            RestaurantTableRepository restaurantTableRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            InventoryRepository inventoryRepository,
            InventoryService inventoryService,
            PaymentService paymentService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
        this.paymentService = paymentService;
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {

            throw new IllegalStateException(
                    "Authenticated user not found"
            );
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found"
                        )
                );
    }

    // =========================================================
    // CUSTOMER CHECK
    // =========================================================

    private boolean isCurrentUserCustomer() {

        return getCurrentUser().getRole()
                == Role.CUSTOMER;
    }

    // =========================================================
    // ORDER OWNERSHIP
    // =========================================================

    private void validateOrderOwnership(
            Order order
    ) {

        if (!isCurrentUserCustomer()) {
            return;
        }

        User currentUser = getCurrentUser();

        if (order.getCustomer() == null
                || order.getCustomer().getId() == null
                || !order.getCustomer()
                .getId()
                .equals(currentUser.getId())) {

            throw new SecurityException(
                    "You are not allowed to access this order"
            );
        }
    }

    // =========================================================
    // CALCULATE REQUIRED INGREDIENTS
    // =========================================================

    private Map<Long, BigDecimal>
    calculateRequiredIngredients(
            List<OrderItem> items
    ) {

        Map<Long, BigDecimal> requiredIngredients =
                new HashMap<>();

        for (OrderItem item : items) {

            if (item.getRecipe() == null
                    || item.getRecipe().getId() == null) {

                throw new IllegalArgumentException(
                        "Recipe is required for each order item"
                );
            }

            List<RecipeIngredient>
                    recipeIngredients =
                    recipeIngredientRepository
                            .findByRecipeId(
                                    item.getRecipe().getId()
                            );

            if (recipeIngredients.isEmpty()) {

                throw new IllegalArgumentException(
                        "Recipe has no ingredients: "
                                + item.getRecipe().getId()
                );
            }

            for (RecipeIngredient recipeIngredient :
                    recipeIngredients) {

                if (recipeIngredient.getIngredient() == null
                        || recipeIngredient.getIngredient().getId() == null) {

                    throw new IllegalArgumentException(
                            "Invalid ingredient in recipe"
                    );
                }

                if (recipeIngredient.getQuantity() == null
                        || recipeIngredient.getQuantity()
                        .compareTo(BigDecimal.ZERO) <= 0) {

                    throw new IllegalArgumentException(
                            "Recipe ingredient quantity must be greater than zero"
                    );
                }

                Long ingredientId =
                        recipeIngredient
                                .getIngredient()
                                .getId();

                BigDecimal recipeQuantity =
                        recipeIngredient.getQuantity();

                BigDecimal orderQuantity =
                        BigDecimal.valueOf(
                                item.getQuantity()
                        );

                BigDecimal requiredQuantity =
                        recipeQuantity.multiply(
                                orderQuantity
                        );

                requiredIngredients.merge(
                        ingredientId,
                        requiredQuantity,
                        BigDecimal::add
                );
            }
        }

        return requiredIngredients;
    }

    // =========================================================
    // LOCK + VALIDATE INGREDIENT STOCK
    // =========================================================

    private void validateIngredientStock(
            Map<Long, BigDecimal> requiredIngredients
    ) {

        List<Long> ingredientIds =
                requiredIngredients.keySet()
                        .stream()
                        .sorted()
                        .toList();

        for (Long ingredientId : ingredientIds) {

            BigDecimal requiredQuantity =
                    requiredIngredients.get(
                            ingredientId
                    );

            Inventory inventory =
                    inventoryRepository
                            .findByIngredientIdForUpdate(
                                    ingredientId
                            )
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Inventory not found for ingredient id: "
                                                    + ingredientId
                                    )
                            );

            BigDecimal currentQuantity =
                    inventory.getCurrentQuantity();

            if (currentQuantity == null) {

                throw new IllegalArgumentException(
                        "Inventory quantity is invalid for ingredient: "
                                + inventory
                                .getIngredient()
                                .getName()
                );
            }

            if (currentQuantity.compareTo(
                    requiredQuantity
            ) < 0) {

                throw new IllegalArgumentException(
                        "Insufficient stock for ingredient: "
                                + inventory
                                .getIngredient()
                                .getName()
                                + ". Required: "
                                + requiredQuantity
                                + ", Available: "
                                + currentQuantity
                );
            }
        }
    }

    // =========================================================
    // CREATE ORDER
    // =========================================================

    @Override
    public Order createOrder(
            Order order,
            List<OrderItem> items
    ) {

        if (order == null) {

            throw new IllegalArgumentException(
                    "Order is required"
            );
        }

        if (order.getOrderType() == null) {

            throw new IllegalArgumentException(
                    "Order type is required"
            );
        }

        if (items == null || items.isEmpty()) {

            throw new IllegalArgumentException(
                    "Order must contain at least one item"
            );
        }

        User currentUser = getCurrentUser();

        // =====================================================
        // CUSTOMER OWNERSHIP
        // =====================================================

        if (currentUser.getRole() == Role.CUSTOMER) {

            order.setCustomer(currentUser);

        } else if (order.getCustomer() != null
                && order.getCustomer().getId() != null) {

            User customer =
                    userRepository.findById(
                            order.getCustomer().getId()
                    ).orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Customer not found"
                            )
                    );

            if (customer.getRole() != Role.CUSTOMER) {

                throw new IllegalArgumentException(
                        "Selected user is not a customer"
                );
            }

            if (!Boolean.TRUE.equals(
                    customer.getActive()
            )) {

                throw new IllegalArgumentException(
                        "Customer account is inactive"
                );
            }

            order.setCustomer(customer);
        }

        // =====================================================
        // DINE-IN
        // =====================================================

        if (order.getOrderType()
                == OrderType.DINE_IN) {

            if (order.getRestaurantTable() == null
                    || order.getRestaurantTable()
                    .getId() == null) {

                throw new IllegalArgumentException(
                        "Table is required for dine-in orders"
                );
            }

            RestaurantTable table =
                    restaurantTableRepository.findByIdForUpdate(
                            order.getRestaurantTable().getId()
                    ).orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Table not found"
                            )
                    );

            if (table.getStatus()
                    != TableStatus.AVAILABLE) {

                throw new IllegalArgumentException(
                        "Table is not available"
                );
            }

            order.setRestaurantTable(table);

        } else if (order.getOrderType()
                == OrderType.PICKUP) {

            if (order.getCustomer() == null
                    || order.getCustomer().getId() == null) {

                throw new IllegalArgumentException(
                        "Customer is required for pickup orders"
                );
            }

            order.setRestaurantTable(null);
        }

        // =====================================================
        // CALCULATE TOTAL
        // =====================================================

        BigDecimal totalAmount =
                BigDecimal.ZERO;

        for (OrderItem item : items) {

            if (item == null) {

                throw new IllegalArgumentException(
                        "Order item cannot be null"
                );
            }

            if (item.getRecipe() == null
                    || item.getRecipe().getId() == null) {

                throw new IllegalArgumentException(
                        "Recipe is required for each order item"
                );
            }

            if (item.getQuantity() == null
                    || item.getQuantity() <= 0) {

                throw new IllegalArgumentException(
                        "Item quantity must be greater than zero"
                );
            }

            Recipe recipe =
                    recipeRepository.findById(
                            item.getRecipe().getId()
                    ).orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Recipe not found"
                            )
                    );

            if (!Boolean.TRUE.equals(
                    recipe.getAvailable()
            )) {

                throw new IllegalArgumentException(
                        "Recipe is not available: "
                                + recipe.getName()
                );
            }

            BigDecimal unitPrice =
                    recipe.calculateDiscountedPrice();

            if (unitPrice == null
                    || unitPrice.compareTo(
                    BigDecimal.ZERO
            ) < 0) {

                throw new IllegalArgumentException(
                        "Recipe price is invalid: "
                                + recipe.getName()
                );
            }

            BigDecimal itemQuantity =
                    BigDecimal.valueOf(
                            item.getQuantity()
                    );

            BigDecimal subtotal =
                    unitPrice.multiply(
                            itemQuantity
                    );

            // Never trust frontend price/subtotal

            item.setOrder(order);
            item.setRecipe(recipe);
            item.setUnitPrice(unitPrice);
            item.setSubtotal(subtotal);

            totalAmount =
                    totalAmount.add(subtotal);
        }

        // =====================================================
        // CALCULATE REQUIRED STOCK
        // =====================================================

        Map<Long, BigDecimal>
                requiredIngredients =
                calculateRequiredIngredients(items);

        validateIngredientStock(
                requiredIngredients
        );

        // =====================================================
        // CREATE ORDER
        // =====================================================

        order.setId(null);

        order.setOrderNumber(
                "ORD-"
                        + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        order.setStatus(
                OrderStatus.PENDING
        );

        order.setTotalAmount(
                totalAmount
        );

        Order savedOrder =
                orderRepository.save(order);

        // =====================================================
        // SAVE ORDER ITEMS
        // =====================================================

        for (OrderItem item : items) {

            item.setOrder(savedOrder);

            orderItemRepository.save(item);
        }

        // =====================================================
        // OCCUPY TABLE
        // =====================================================

        if (savedOrder.getOrderType()
                == OrderType.DINE_IN) {

            RestaurantTable table =
                    savedOrder.getRestaurantTable();

            table.setStatus(
                    TableStatus.OCCUPIED
            );

            restaurantTableRepository.save(table);
        }

        // =====================================================
        // DEDUCT STOCK
        // =====================================================

        for (Long ingredientId :
                requiredIngredients.keySet()) {

            inventoryService.deductStock(
                    ingredientId,
                    requiredIngredients.get(
                            ingredientId
                    )
            );
        }

        return savedOrder;
    }

    /** Creates the order attached to an approved table reservation. Stock is consumed only when staff approves. */
    @Override
    public Order createReservationOrder(Order reservationOrder, List<OrderItem> items) {
        if (reservationOrder == null || reservationOrder.getCustomer() == null || reservationOrder.getCustomer().getId() == null) {
            throw new IllegalArgumentException("Reservation order customer is required");
        }
        if (reservationOrder.getRestaurantTable() == null || reservationOrder.getRestaurantTable().getId() == null) {
            throw new IllegalArgumentException("Reservation order table is required");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Reservation must contain at least one recipe");
        }

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : items) {
            if (item == null || item.getRecipe() == null || item.getRecipe().getId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Invalid reservation recipe item");
            }
            Recipe recipe = recipeRepository.findById(item.getRecipe().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));
            if (!Boolean.TRUE.equals(recipe.getAvailable())) throw new IllegalArgumentException("Recipe is unavailable: " + recipe.getName());
            BigDecimal unitPrice = recipe.calculateDiscountedPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setRecipe(recipe);
            item.setUnitPrice(unitPrice);
            item.setSubtotal(subtotal);
            total = total.add(subtotal);
        }

        Map<Long, BigDecimal> required = calculateRequiredIngredients(items);
        validateIngredientStock(required);

        Order order = new Order();
        order.setCustomer(reservationOrder.getCustomer());
        order.setOrderType(OrderType.DINE_IN);
        order.setRestaurantTable(reservationOrder.getRestaurantTable());
        order.setOrderNumber("RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrder(saved);
            orderItemRepository.save(item);
        }
        saved.getRestaurantTable().setStatus(TableStatus.RESERVED);
        restaurantTableRepository.save(saved.getRestaurantTable());

        for (Map.Entry<Long, BigDecimal> entry : required.entrySet()) {
            inventoryService.deductStock(entry.getKey(), entry.getValue());
        }
        return saved;
    }

    // =========================================================
    // GET ALL ORDERS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {

        if (isCurrentUserCustomer()) {

            User currentUser =
                    getCurrentUser();

            return orderRepository
                    .findByCustomerId(
                            currentUser.getId()
                    );
        }

        return orderRepository.findAll();
    }

    // =========================================================
    // GET ORDER BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Order id is required"
            );
        }

        Order order =
                orderRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Order not found with id: "
                                                + id
                                )
                        );

        validateOrderOwnership(order);

        return order;
    }

    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    @Override
    public Order updateOrderStatus(
            Long id,
            OrderStatus newStatus
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Order id is required"
            );
        }

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "Order status is required"
            );
        }

        Order order =
                orderRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Order not found with id: "
                                                + id
                                )
                        );

        if (isCurrentUserCustomer()) {

            throw new SecurityException(
                    "Customers are not allowed "
                            + "to change order status"
            );
        }

        OrderStatus currentStatus =
                order.getStatus();

        if (currentStatus == null) {

            throw new IllegalArgumentException(
                    "Current order status is invalid"
            );
        }

        if (currentStatus == newStatus) {
            return order;
        }

        // =====================================================
        // TERMINAL STATES
        // =====================================================

        if (currentStatus == OrderStatus.COMPLETED
                || currentStatus == OrderStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "Order is already in a terminal state: "
                            + currentStatus
            );
        }

        // =====================================================
        // VALID STATUS TRANSITIONS
        // =====================================================

        boolean validTransition = false;

        switch (currentStatus) {

            case PENDING:

                validTransition =
                        newStatus == OrderStatus.CONFIRMED
                                || newStatus == OrderStatus.CANCELLED;

                break;

            case CONFIRMED:

                validTransition =
                        newStatus == OrderStatus.PREPARING
                                || newStatus == OrderStatus.CANCELLED;

                break;

            case PREPARING:

                validTransition =
                        newStatus == OrderStatus.READY
                                || newStatus == OrderStatus.CANCELLED;

                break;

            case READY:

                validTransition =
                        newStatus == OrderStatus.COMPLETED
                                || newStatus == OrderStatus.CANCELLED;

                break;

            default:

                validTransition = false;
        }

        if (!validTransition) {

            throw new IllegalArgumentException(
                    "Invalid order status transition: "
                            + currentStatus
                            + " -> "
                            + newStatus
            );
        }

        // =====================================================
        // RESTORE STOCK WHEN ORDER IS CANCELLED
        // =====================================================

        if (newStatus == OrderStatus.CANCELLED) {

            List<OrderItem> orderItems =
                    orderItemRepository.findByOrderId(id);

            if (orderItems == null
                    || orderItems.isEmpty()) {

                throw new IllegalStateException(
                        "Cannot cancel order because "
                                + "no order items were found"
                );
            }

            Map<Long, BigDecimal>
                    requiredIngredients =
                    calculateRequiredIngredients(
                            orderItems
                    );

            /*
             * Stock was deducted during order creation.
             * Restore the exact same quantities here.
             */
            for (Map.Entry<Long, BigDecimal> entry :
                    requiredIngredients.entrySet()) {

                inventoryService.restoreStock(
                        entry.getKey(),
                        entry.getValue(),
                        order.getId()
                );
            }
        }

        // =====================================================
        // UPDATE ORDER STATUS
        // =====================================================

        order.setStatus(newStatus);

        // =====================================================
        // FREE RESTAURANT TABLE
        // =====================================================

        if ((newStatus == OrderStatus.COMPLETED
                || newStatus == OrderStatus.CANCELLED)
                && order.getRestaurantTable() != null) {

            RestaurantTable table =
                    order.getRestaurantTable();

            table.setStatus(
                    TableStatus.AVAILABLE
            );

            restaurantTableRepository.save(table);
        }

        Order saved = orderRepository.save(order);

        // A completed order always gets a single UNPAID payment record.
        // For reservation orders, the payment is created only when the reservation is CONFIRMED.
        if (newStatus == OrderStatus.COMPLETED) {
            paymentService.createAutomaticPaymentIfEligible(saved);
        }

        return saved;
    }

    // =========================================================
    // GET ORDERS BY STATUS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByStatus(
            OrderStatus status
    ) {

        if (status == null) {

            throw new IllegalArgumentException(
                    "Order status is required"
            );
        }

        if (isCurrentUserCustomer()) {

            User currentUser =
                    getCurrentUser();

            return orderRepository
                    .findByStatusAndCustomerId(
                            status,
                            currentUser.getId()
                    );
        }

        return orderRepository.findByStatus(
                status
        );
    }

    // =========================================================
    // GET ORDERS BY TYPE
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByType(
            OrderType orderType
    ) {

        if (orderType == null) {

            throw new IllegalArgumentException(
                    "Order type is required"
            );
        }

        if (isCurrentUserCustomer()) {

            User currentUser =
                    getCurrentUser();

            return orderRepository
                    .findByOrderTypeAndCustomerId(
                            orderType,
                            currentUser.getId()
                    );
        }

        return orderRepository.findByOrderType(
                orderType
        );
    }

    // =========================================================
    // GET ORDERS BY CUSTOMER
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(
            Long customerId
    ) {

        if (customerId == null) {

            throw new IllegalArgumentException(
                    "Customer id is required"
            );
        }

        if (isCurrentUserCustomer()) {

            User currentUser =
                    getCurrentUser();

            if (!currentUser.getId()
                    .equals(customerId)) {

                throw new SecurityException(
                        "You are not allowed to access "
                                + "another customer's orders"
                );
            }
        }

        return orderRepository.findByCustomerId(
                customerId
        );
    }

    // =========================================================
    // GET ORDERS BY TABLE
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByTable(
            Long tableId
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table id is required"
            );
        }

        /*
         * Customers should not be able to query
         * orders by restaurant table.
         */
        if (isCurrentUserCustomer()) {

            throw new SecurityException(
                    "Customers are not allowed "
                            + "to access orders by table"
            );
        }

        return orderRepository
                .findByRestaurantTableId(tableId);
    }
}