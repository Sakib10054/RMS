package restaurant_management.controller;

import restaurant_management.entity.StockMovement;
import restaurant_management.service.StockMovementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    public StockMovementController(
            StockMovementService stockMovementService
    ) {
        this.stockMovementService = stockMovementService;
    }

    @GetMapping
    public ResponseEntity<List<StockMovement>> getAllMovements() {
        return ResponseEntity.ok(
                stockMovementService.getAllMovements()
        );
    }

    @GetMapping("/{ingredientId}")
    public ResponseEntity<List<StockMovement>> getMovementsByIngredient(
            @PathVariable Long ingredientId) {

        return ResponseEntity.ok(
                stockMovementService.getMovementsByIngredient(
                        ingredientId
                )
        );
    }
}