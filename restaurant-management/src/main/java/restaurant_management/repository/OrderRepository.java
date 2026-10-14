package restaurant_management.repository;

import restaurant_management.entity.Order;
import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.OrderType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(
            String orderNumber
    );

    boolean existsByOrderNumber(
            String orderNumber
    );

    // =========================================================
    // ORDER FILTERS
    // =========================================================

    List<Order> findByStatus(
            OrderStatus status
    );

    List<Order> findByStatusAndCustomerId(
            OrderStatus status,
            Long customerId
    );

    List<Order> findByOrderType(
            OrderType orderType
    );

    List<Order> findByOrderTypeAndCustomerId(
            OrderType orderType,
            Long customerId
    );

    List<Order> findByCustomerId(
            Long customerId
    );

    List<Order> findByRestaurantTableId(
            Long tableId
    );

    List<Order> findByRestaurantTableIdAndCustomerId(
            Long tableId,
            Long customerId
    );

    // =========================================================
    // DASHBOARD QUERIES
    // =========================================================

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        """)
    long countTotalOrders();

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status = :status
        """)
    long countByStatus(
            @Param("status") OrderStatus status
    );

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.orderDate >= :startDate
        AND o.orderDate < :endDate
        """)
    long countOrdersBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.status = :status
        AND o.orderDate >= :startDate
        AND o.orderDate < :endDate
        """)
    BigDecimal getSalesByStatusAndDateRange(
            @Param("status") OrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // =========================================================
    // COMPLETED SALES
    // =========================================================

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.status =
              restaurant_management.enums.OrderStatus.COMPLETED
        AND o.orderDate >= :startDate
        AND o.orderDate < :endDate
        """)
    BigDecimal getCompletedSales(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status =
              restaurant_management.enums.OrderStatus.COMPLETED
        AND o.orderDate >= :startDate
        AND o.orderDate < :endDate
        """)
    Long countCompletedOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

