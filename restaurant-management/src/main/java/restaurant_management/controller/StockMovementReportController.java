package restaurant_management.controller;

import restaurant_management.entity.StockMovement;
import restaurant_management.service.StockMovementReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports/stock-movements")
public class StockMovementReportController {

    private final StockMovementReportService stockMovementReportService;

    public StockMovementReportController(
            StockMovementReportService stockMovementReportService) {
        this.stockMovementReportService = stockMovementReportService;
    }

    @GetMapping
    public List<StockMovement> getMovementsByDateRange(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {

        return stockMovementReportService.getMovementsByDateRange(
                from,
                to
        );
    }
}