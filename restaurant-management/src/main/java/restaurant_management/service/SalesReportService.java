package restaurant_management.service;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface SalesReportService {

    BigDecimal getDailySales(LocalDate date);

    BigDecimal getWeeklySales(LocalDate date);

    BigDecimal getMonthlySales(LocalDate date);

    Long getCompletedOrderCount(LocalDate date);

    BigDecimal getAverageOrderValue(LocalDate date);
}