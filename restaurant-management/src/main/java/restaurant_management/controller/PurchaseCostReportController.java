package restaurant_management.controller;

import restaurant_management.service.PurchaseCostReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/purchase-cost")
public class PurchaseCostReportController {

    private final PurchaseCostReportService purchaseCostReportService;

    public PurchaseCostReportController(
            PurchaseCostReportService purchaseCostReportService) {
        this.purchaseCostReportService = purchaseCostReportService;
    }

    @GetMapping
    public BigDecimal getTotalPurchaseCost(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {

        return purchaseCostReportService.getTotalPurchaseCost(
                from,
                to
        );
    }
}