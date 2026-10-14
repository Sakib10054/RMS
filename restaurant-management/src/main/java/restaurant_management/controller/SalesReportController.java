package restaurant_management.controller;

import restaurant_management.service.SalesReportService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/sales")
public class SalesReportController {

    private final SalesReportService salesReportService;

    public SalesReportController(SalesReportService salesReportService) {
        this.salesReportService = salesReportService;
    }

    @GetMapping("/daily")
    public BigDecimal getDailySales(@RequestParam LocalDate date) {
        return salesReportService.getDailySales(date);
    }

    @GetMapping("/weekly")
    public BigDecimal getWeeklySales(@RequestParam LocalDate date) {
        return salesReportService.getWeeklySales(date);
    }

    @GetMapping("/monthly")
    public BigDecimal getMonthlySales(@RequestParam LocalDate date) {
        return salesReportService.getMonthlySales(date);
    }

    @GetMapping("/completed-count")
    public Long getCompletedOrderCount(@RequestParam LocalDate date) {
        return salesReportService.getCompletedOrderCount(date);
    }

    @GetMapping("/average-order-value")
    public BigDecimal getAverageOrderValue(@RequestParam LocalDate date) {
        return salesReportService.getAverageOrderValue(date);
    }
}