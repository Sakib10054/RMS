package restaurant_management.controller;

import restaurant_management.service.BestSellingReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports/best-selling")
public class BestSellingReportController {

    private final BestSellingReportService bestSellingReportService;

    public BestSellingReportController(
            BestSellingReportService bestSellingReportService) {
        this.bestSellingReportService = bestSellingReportService;
    }

    @GetMapping
    public List<Object[]> getBestSellingRecipes() {
        return bestSellingReportService.getBestSellingRecipes();
    }
}