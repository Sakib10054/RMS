package restaurant_management.controller;

import restaurant_management.entity.Inventory;
import restaurant_management.service.InventoryReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports/inventory")
public class InventoryReportController {

    private final InventoryReportService inventoryReportService;

    public InventoryReportController(
            InventoryReportService inventoryReportService) {
        this.inventoryReportService = inventoryReportService;
    }

    @GetMapping
    public List<Inventory> getInventoryReport() {
        return inventoryReportService.getInventoryReport();
    }
}