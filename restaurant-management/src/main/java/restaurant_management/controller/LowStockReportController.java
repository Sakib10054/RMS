package restaurant_management.controller;

import restaurant_management.entity.Inventory;
import restaurant_management.service.LowStockReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports/low-stock")
public class LowStockReportController {

    private final LowStockReportService lowStockReportService;

    public LowStockReportController(
            LowStockReportService lowStockReportService) {
        this.lowStockReportService = lowStockReportService;
    }

    @GetMapping
    public List<Inventory> getLowStockInventory() {
        return lowStockReportService.getLowStockInventory();
    }
}