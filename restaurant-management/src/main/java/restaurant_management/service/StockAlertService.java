package restaurant_management.service;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.StockAlert;

import java.math.BigDecimal;
import java.util.List;

public interface StockAlertService {

    List<StockAlert> getAllAlerts();

    List<StockAlert> getActiveAlerts();

    StockAlert resolveAlert(Long id);

    void checkAndCreateAlert(
            Ingredient ingredient,
            BigDecimal currentQuantity
    );
}