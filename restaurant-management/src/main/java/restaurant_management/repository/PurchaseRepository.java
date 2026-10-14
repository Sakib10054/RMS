package restaurant_management.repository;

import restaurant_management.entity.Purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PurchaseRepository
        extends JpaRepository<Purchase, Long> {

    List<Purchase> findByIngredientId(Long ingredientId);

    List<Purchase> findBySupplier(String supplier);

    List<Purchase> findByPurchaseDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(p.totalPrice), 0)
        FROM Purchase p
        WHERE p.purchaseDate >= :from
        AND p.purchaseDate <= :to
        """)
    BigDecimal getTotalPurchaseCost(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // =========================================================
    // DASHBOARD
    // =========================================================

    @Query("""
        SELECT COALESCE(SUM(p.totalPrice), 0)
        FROM Purchase p
        """)
    BigDecimal getTotalPurchaseCost();
}