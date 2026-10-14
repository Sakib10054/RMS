package restaurant_management.service.impl;

import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.PaymentStatus;
import restaurant_management.enums.StockStatus;
import restaurant_management.enums.TableStatus;

import restaurant_management.repository.OrderRepository;
import restaurant_management.repository.RecipeRepository;
import restaurant_management.repository.IngredientRepository;
import restaurant_management.repository.RestaurantTableRepository;
import restaurant_management.repository.PaymentRepository;
import restaurant_management.repository.PurchaseRepository;

import restaurant_management.service.DashboardService;
import restaurant_management.service.InventoryService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl
        implements DashboardService {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final PaymentRepository paymentRepository;
    private final PurchaseRepository purchaseRepository;

    public DashboardServiceImpl(
            OrderRepository orderRepository,
            InventoryService inventoryService,
            RecipeRepository recipeRepository,
            IngredientRepository ingredientRepository,
            RestaurantTableRepository restaurantTableRepository,
            PaymentRepository paymentRepository,
            PurchaseRepository purchaseRepository) {

        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.paymentRepository = paymentRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    public Map<String, Object> getDashboardSummary() {

        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday =
                today.atStartOfDay();

        LocalDateTime startOfTomorrow =
                today.plusDays(1).atStartOfDay();

        // =====================================================
        // ORDER SUMMARY
        // =====================================================

        long totalOrders =
                orderRepository.countTotalOrders();

        long pendingOrders =
                orderRepository.countByStatus(
                        OrderStatus.PENDING
                );

        long completedOrders =
                orderRepository.countByStatus(
                        OrderStatus.COMPLETED
                );

        long cancelledOrders =
                orderRepository.countByStatus(
                        OrderStatus.CANCELLED
                );

        long todayOrders =
                orderRepository.countOrdersBetween(
                        startOfToday,
                        startOfTomorrow
                );

        // =====================================================
        // TODAY'S SALES
        //
        // Sales are based on COMPLETED orders.
        // =====================================================

        BigDecimal todaySales =
                orderRepository.getSalesByStatusAndDateRange(
                        OrderStatus.COMPLETED,
                        startOfToday,
                        startOfTomorrow
                );

        if (todaySales == null) {
            todaySales = BigDecimal.ZERO;
        }

        // =====================================================
        // LOW STOCK
        // =====================================================

        long lowStockItems =
                inventoryService.getAllInventory()
                        .stream()
                        .filter(inventory -> {

                            if (inventory.getIngredient() == null
                                    || inventory.getIngredient().getId() == null) {
                                return false;
                            }

                            StockStatus status =
                                    inventoryService.getStockStatus(
                                            inventory.getIngredient().getId()
                                    );

                            return status == StockStatus.LOW_STOCK
                                    || status == StockStatus.OUT_OF_STOCK;
                        })
                        .count();

        // =====================================================
        // RECIPE / INGREDIENT
        // =====================================================

        long totalRecipes =
                recipeRepository.count();

        long totalIngredients =
                ingredientRepository.count();

        // =====================================================
        // TABLE SUMMARY
        // =====================================================

        long totalTables =
                restaurantTableRepository.count();

        long occupiedTables =
                restaurantTableRepository.countByStatus(
                        TableStatus.OCCUPIED
                );

        long availableTables =
                restaurantTableRepository.countByStatus(
                        TableStatus.AVAILABLE
                );

        // =====================================================
        // PAYMENT SUMMARY
        // =====================================================

        long totalPayments =
                paymentRepository.count();

        long paidPayments =
                paymentRepository
                        .findByPaymentStatus(
                                PaymentStatus.PAID
                        )
                        .size();

        long unpaidPayments =
                paymentRepository
                        .findByPaymentStatus(
                                PaymentStatus.UNPAID
                        )
                        .size();

        // =====================================================
        // TOTAL PURCHASE COST
        // =====================================================

        BigDecimal totalPurchaseCost =
                purchaseRepository.getTotalPurchaseCost();

        if (totalPurchaseCost == null) {
            totalPurchaseCost = BigDecimal.ZERO;
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        Map<String, Object> summary =
                new HashMap<>();

        summary.put(
                "totalOrders",
                totalOrders
        );

        summary.put(
                "pendingOrders",
                pendingOrders
        );

        summary.put(
                "completedOrders",
                completedOrders
        );

        summary.put(
                "cancelledOrders",
                cancelledOrders
        );

        summary.put(
                "todayOrders",
                todayOrders
        );

        summary.put(
                "todaySales",
                todaySales
        );

        summary.put(
                "lowStockItems",
                lowStockItems
        );

        summary.put(
                "totalRecipes",
                totalRecipes
        );

        summary.put(
                "totalIngredients",
                totalIngredients
        );

        summary.put(
                "totalTables",
                totalTables
        );

        summary.put(
                "occupiedTables",
                occupiedTables
        );

        summary.put(
                "availableTables",
                availableTables
        );

        summary.put(
                "totalPayments",
                totalPayments
        );

        summary.put(
                "paidPayments",
                paidPayments
        );

        summary.put(
                "unpaidPayments",
                unpaidPayments
        );

        summary.put(
                "totalPurchaseCost",
                totalPurchaseCost
        );

        return summary;
    }
}