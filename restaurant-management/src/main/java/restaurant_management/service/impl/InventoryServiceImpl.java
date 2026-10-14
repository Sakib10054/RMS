package restaurant_management.service.impl;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.Inventory;
import restaurant_management.entity.StockMovement;
import restaurant_management.enums.StockMovementType;
import restaurant_management.enums.StockStatus;
import restaurant_management.repository.IngredientRepository;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.repository.StockMovementRepository;
import restaurant_management.service.InventoryService;
import restaurant_management.service.StockAlertService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final IngredientRepository ingredientRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAlertService stockAlertService;

    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            IngredientRepository ingredientRepository,
            StockMovementRepository stockMovementRepository,
            StockAlertService stockAlertService
    ) {
        this.inventoryRepository = inventoryRepository;
        this.ingredientRepository = ingredientRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.stockAlertService = stockAlertService;
    }

    @Override
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Override
    public Inventory getInventoryByIngredientId(
            Long ingredientId) {

        return inventoryRepository.findByIngredientId(ingredientId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Inventory not found for ingredient id: "
                                        + ingredientId
                        )
                );
    }

    // =========================================================
    // DEDUCT STOCK
    // =========================================================

    @Override
    @Transactional
    public void deductStock(
            Long ingredientId,
            BigDecimal quantity
    ) {

        if (ingredientId == null) {
            throw new IllegalArgumentException(
                    "Ingredient id is required"
            );
        }

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Quantity must be greater than 0"
            );
        }

        /*
         * PESSIMISTIC WRITE LOCK
         *
         * The inventory row is locked until
         * this transaction finishes.
         */
        Inventory inventory =
                inventoryRepository
                        .findByIngredientIdForUpdate(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Inventory not found for ingredient id: "
                                                + ingredientId
                                )
                        );

        Ingredient ingredient =
                ingredientRepository.findById(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ingredient not found with id: "
                                                + ingredientId
                                )
                        );

        BigDecimal currentQuantity =
                inventory.getCurrentQuantity();

        if (currentQuantity == null) {
            throw new IllegalArgumentException(
                    "Current inventory quantity is invalid"
            );
        }

        if (currentQuantity.compareTo(quantity) < 0) {

            throw new IllegalArgumentException(
                    "Insufficient stock for ingredient: "
                            + ingredient.getName()
                            + ". Required: "
                            + quantity
                            + ", Available: "
                            + currentQuantity
            );
        }

        BigDecimal remainingQuantity =
                currentQuantity.subtract(quantity);

        inventory.setCurrentQuantity(
                remainingQuantity
        );

        inventoryRepository.save(inventory);

        stockAlertService.checkAndCreateAlert(
                ingredient,
                remainingQuantity
        );

        StockMovement movement =
                StockMovement.builder()
                        .ingredient(ingredient)
                        .type(
                                StockMovementType.ORDER_CONSUMPTION
                        )
                        .quantity(quantity)
                        .note(
                                "Stock deducted for order consumption"
                        )
                        .build();

        stockMovementRepository.save(movement);
    }

    // =========================================================
    // RESTORE STOCK
    // =========================================================

    @Override
    @Transactional
    public void restoreStock(
            Long ingredientId,
            BigDecimal quantity,
            Long orderId
    ) {

        if (ingredientId == null) {
            throw new IllegalArgumentException(
                    "Ingredient id is required"
            );
        }

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Restore quantity must be greater than 0"
            );
        }

        Inventory inventory =
                inventoryRepository
                        .findByIngredientIdForUpdate(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Inventory not found for ingredient id: "
                                                + ingredientId
                                )
                        );

        Ingredient ingredient =
                ingredientRepository.findById(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ingredient not found with id: "
                                                + ingredientId
                                )
                        );

        BigDecimal currentQuantity =
                inventory.getCurrentQuantity();

        if (currentQuantity == null) {
            throw new IllegalArgumentException(
                    "Current inventory quantity is invalid"
            );
        }

        BigDecimal restoredQuantity =
                currentQuantity.add(quantity);

        inventory.setCurrentQuantity(
                restoredQuantity
        );

        inventoryRepository.save(inventory);

        StockMovement movement =
                StockMovement.builder()
                        .ingredient(ingredient)
                        .type(
                                StockMovementType.ADJUSTMENT
                        )
                        .quantity(quantity)
                        .referenceId(orderId)
                        .note(
                                "Stock restored because order "
                                        + orderId
                                        + " was cancelled"
                        )
                        .build();

        stockMovementRepository.save(movement);

        stockAlertService.checkAndCreateAlert(
                ingredient,
                restoredQuantity
        );
    }

    // =========================================================
    // STOCK STATUS
    // =========================================================

    @Override
    public StockStatus getStockStatus(
            Long ingredientId) {

        Inventory inventory =
                getInventoryByIngredientId(ingredientId);

        BigDecimal currentQuantity =
                inventory.getCurrentQuantity();

        BigDecimal minimumStock =
                inventory.getIngredient()
                        .getMinimumStock();

        if (currentQuantity == null
                || currentQuantity.compareTo(
                BigDecimal.ZERO
        ) <= 0) {

            return StockStatus.OUT_OF_STOCK;
        }

        if (minimumStock != null
                && currentQuantity.compareTo(
                minimumStock
        ) <= 0) {

            return StockStatus.LOW_STOCK;
        }

        return StockStatus.NORMAL;
    }
}