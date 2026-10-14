package restaurant_management.controller;

import restaurant_management.entity.Purchase;
import restaurant_management.service.PurchaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.validation.Valid;

import java.time.LocalDate;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<Purchase> createPurchase(
            @Valid @RequestBody Purchase purchase) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(purchaseService.createPurchase(purchase));
    }

    @GetMapping
    public ResponseEntity<List<Purchase>> getAllPurchases() {
        return ResponseEntity.ok(
                purchaseService.getAllPurchases()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Purchase> getPurchaseById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                purchaseService.getPurchaseById(id)
        );
    }


    @GetMapping("/filter")
    public ResponseEntity<List<Purchase>> filterPurchases(
            @RequestParam(required = false) Long ingredientId,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {

        if (ingredientId != null) {
            return ResponseEntity.ok(
                    purchaseService.getPurchasesByIngredient(ingredientId)
            );
        }

        if (supplier != null) {
            return ResponseEntity.ok(
                    purchaseService.getPurchasesBySupplier(supplier)
            );
        }

        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(
                    purchaseService.getPurchasesByDateRange(
                            startDate,
                            endDate
                    )
            );
        }

        return ResponseEntity.ok(
                purchaseService.getAllPurchases()
        );
    }
}