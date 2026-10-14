package restaurant_management.controller;

import restaurant_management.entity.Purchase;
import restaurant_management.service.PurchaseReportService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports/purchases")
public class PurchaseReportController {

    private final PurchaseReportService purchaseReportService;

    public PurchaseReportController(
            PurchaseReportService purchaseReportService) {
        this.purchaseReportService = purchaseReportService;
    }

    @GetMapping
    public List<Purchase> getPurchasesByDateRange(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {

        return purchaseReportService.getPurchasesByDateRange(
                from,
                to
        );
    }
}