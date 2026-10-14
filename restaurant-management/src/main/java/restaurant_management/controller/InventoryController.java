package restaurant_management.controller;

import restaurant_management.entity.Inventory;
import restaurant_management.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant_management.enums.StockStatus;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<Inventory>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @GetMapping("/{ingredientId}")
    public ResponseEntity<Inventory> getInventoryByIngredientId(
            @PathVariable Long ingredientId) {

        return ResponseEntity.ok(
                inventoryService.getInventoryByIngredientId(ingredientId)
        );
    }
    @GetMapping("/{ingredientId}/status")
    public ResponseEntity<StockStatus> getStockStatus(
            @PathVariable Long ingredientId) {
        return ResponseEntity.ok(
                inventoryService.getStockStatus(ingredientId)
        );
    }
}