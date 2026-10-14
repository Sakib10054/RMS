package restaurant_management.repository;

import restaurant_management.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByIngredientId(
            Long ingredientId
    );

    boolean existsByIngredientId(
            Long ingredientId
    );

    /**
     * Locks the inventory row using PESSIMISTIC_WRITE.
     *
     * The row remains locked until the current transaction
     * is completed or rolled back.
     *
     * This prevents two concurrent orders from modifying
     * the same inventory row at the same time.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i
        FROM Inventory i
        WHERE i.ingredient.id = :ingredientId
        """)
    Optional<Inventory> findByIngredientIdForUpdate(
            @Param("ingredientId") Long ingredientId
    );

    @Query("""
        SELECT i
        FROM Inventory i
        WHERE i.currentQuantity <= i.ingredient.minimumStock
        ORDER BY i.currentQuantity ASC
        """)
    List<Inventory> findLowStockInventory();
}

