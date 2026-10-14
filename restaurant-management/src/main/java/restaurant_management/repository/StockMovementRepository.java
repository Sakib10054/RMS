package restaurant_management.repository;

import restaurant_management.entity.StockMovement;
import restaurant_management.enums.StockMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository
        extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByIngredientId(Long ingredientId);

    List<StockMovement> findByType(StockMovementType type);

    @Query("""
        SELECT sm
        FROM StockMovement sm
        WHERE sm.date >= :startDate
        AND sm.date < :endDate
        ORDER BY sm.date DESC
        """)
    List<StockMovement> findByMovementDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

