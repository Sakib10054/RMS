package restaurant_management.repository;

import restaurant_management.entity.StockAlert;
import restaurant_management.enums.StockAlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockAlertRepository
        extends JpaRepository<StockAlert, Long> {

    List<StockAlert> findByStatus(StockAlertStatus status);

    List<StockAlert> findByIngredientId(Long ingredientId);

    List<StockAlert> findByIngredientIdAndStatus(
            Long ingredientId,
            StockAlertStatus status
    );

    boolean existsByIngredientIdAndStatus(
            Long ingredientId,
            StockAlertStatus status
    );
}