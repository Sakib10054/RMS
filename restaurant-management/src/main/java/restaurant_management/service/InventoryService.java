package restaurant_management.service;

import restaurant_management.entity.Inventory;
import restaurant_management.enums.StockStatus;

import java.math.BigDecimal;
import java.util.List;

public interface InventoryService {

    List<Inventory> getAllInventory();

    Inventory getInventoryByIngredientId(Long ingredientId);

    void deductStock(
            Long ingredientId,
            BigDecimal quantity
    );

    void restoreStock(
            Long ingredientId,
            BigDecimal quantity,
            Long orderId
    );

    StockStatus getStockStatus(Long ingredientId);
}