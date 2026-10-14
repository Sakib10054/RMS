package restaurant_management.service;

import restaurant_management.entity.Purchase;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseService {

    Purchase createPurchase(Purchase purchase);

    List<Purchase> getAllPurchases();

    Purchase getPurchaseById(Long id);

    List<Purchase> getPurchasesByIngredient(Long ingredientId);

    List<Purchase> getPurchasesBySupplier(String supplier);

    List<Purchase> getPurchasesByDateRange(
            LocalDate startDate,
            LocalDate endDate
    );
}