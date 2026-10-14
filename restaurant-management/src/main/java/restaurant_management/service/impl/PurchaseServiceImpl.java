package restaurant_management.service.impl;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.Inventory;
import restaurant_management.entity.Purchase;
import restaurant_management.entity.StockMovement;
import restaurant_management.enums.StockMovementType;
import restaurant_management.repository.IngredientRepository;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.repository.PurchaseRepository;
import restaurant_management.repository.StockMovementRepository;
import restaurant_management.service.PurchaseService;
import restaurant_management.service.StockAlertService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PurchaseServiceImpl implements PurchaseService {

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAlertService stockAlertService;
    private final PurchaseRepository purchaseRepository;
    private final IngredientRepository ingredientRepository;

    public PurchaseServiceImpl(
            PurchaseRepository purchaseRepository,
            IngredientRepository ingredientRepository,
            InventoryRepository inventoryRepository,
            StockMovementRepository stockMovementRepository,
            StockAlertService stockAlertService
    ) {
        this.purchaseRepository = purchaseRepository;
        this.ingredientRepository = ingredientRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.stockAlertService = stockAlertService;
    }

    @Override
    @Transactional
    public Purchase createPurchase(Purchase purchase) {

        if (purchase == null) {
            throw new IllegalArgumentException(
                    "Purchase is required"
            );
        }

        if (purchase.getIngredient() == null
                || purchase.getIngredient().getId() == null) {

            throw new IllegalArgumentException(
                    "Ingredient is required"
            );
        }

        Long ingredientId =
                purchase.getIngredient().getId();

        Ingredient ingredient =
                ingredientRepository.findById(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ingredient not found with id: "
                                                + ingredientId
                                )
                        );

        if (purchase.getQuantity() == null
                || purchase.getQuantity()
                .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Quantity must be greater than 0"
            );
        }

        if (purchase.getUnitPrice() == null
                || purchase.getUnitPrice()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Unit price cannot be negative"
            );
        }

        purchase.setIngredient(ingredient);

        /*
         * Always calculate total price on backend.
         */
        BigDecimal totalPrice =
                purchase.getUnitPrice()
                        .multiply(purchase.getQuantity());

        purchase.setTotalPrice(totalPrice);

        /*
         * Lock inventory row before changing quantity.
         */
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

        Purchase savedPurchase =
                purchaseRepository.save(purchase);

        BigDecimal currentQuantity =
                inventory.getCurrentQuantity();

        if (currentQuantity == null) {
            throw new IllegalArgumentException(
                    "Current inventory quantity is invalid"
            );
        }

        BigDecimal newQuantity =
                currentQuantity.add(
                        purchase.getQuantity()
                );

        inventory.setCurrentQuantity(newQuantity);

        inventoryRepository.save(inventory);

        stockAlertService.checkAndCreateAlert(
                ingredient,
                newQuantity
        );

        StockMovement movement =
                StockMovement.builder()
                        .ingredient(ingredient)
                        .type(StockMovementType.PURCHASE)
                        .quantity(purchase.getQuantity())
                        .referenceId(savedPurchase.getId())
                        .note("Stock added from purchase")
                        .build();

        stockMovementRepository.save(movement);

        return savedPurchase;
    }

    @Override
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    @Override
    public Purchase getPurchaseById(Long id) {

        return purchaseRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Purchase not found with id: "
                                        + id
                        )
                );
    }

    @Override
    public List<Purchase> getPurchasesByIngredient(
            Long ingredientId) {

        return purchaseRepository.findByIngredientId(
                ingredientId
        );
    }

    @Override
    public List<Purchase> getPurchasesBySupplier(
            String supplier) {

        return purchaseRepository.findBySupplier(
                supplier
        );
    }

    @Override
    public List<Purchase> getPurchasesByDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        return purchaseRepository.findByPurchaseDateBetween(
                startDate,
                endDate
        );
    }
}