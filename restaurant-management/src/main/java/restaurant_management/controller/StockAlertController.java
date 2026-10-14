package restaurant_management.controller;

import restaurant_management.entity.StockAlert;
import restaurant_management.service.StockAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-alerts")
public class StockAlertController {

    private final StockAlertService stockAlertService;

    public StockAlertController(
            StockAlertService stockAlertService
    ) {
        this.stockAlertService = stockAlertService;
    }

    // =========================================================
    // GET ALL STOCK ALERTS
    // STAFF + MANAGER
    // =========================================================

    @GetMapping
    public ResponseEntity<List<StockAlert>> getAllAlerts() {

        return ResponseEntity.ok(
                stockAlertService.getAllAlerts()
        );
    }

    // =========================================================
    // GET ACTIVE STOCK ALERTS
    // STAFF + MANAGER
    // =========================================================

    @GetMapping("/active")
    public ResponseEntity<List<StockAlert>> getActiveAlerts() {

        return ResponseEntity.ok(
                stockAlertService.getActiveAlerts()
        );
    }

    // =========================================================
    // RESOLVE STOCK ALERT
    // STAFF + MANAGER
    // =========================================================

    @PutMapping("/{id}/resolve")
    public ResponseEntity<StockAlert> resolveAlert(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                stockAlertService.resolveAlert(id)
        );
    }
}