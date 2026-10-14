package restaurant_management.service.impl;

import restaurant_management.repository.OrderRepository;
import restaurant_management.service.SalesReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
public class SalesReportServiceImpl implements SalesReportService {

    private final OrderRepository orderRepository;

    public SalesReportServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getDailySales(LocalDate date) {

        LocalDateTime startDate = date.atStartOfDay();
        LocalDateTime endDate = date.plusDays(1).atStartOfDay();

        return orderRepository.getCompletedSales(startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getWeeklySales(LocalDate date) {

        LocalDate startOfWeek = date.with(
                java.time.DayOfWeek.MONDAY
        );

        LocalDateTime startDate = startOfWeek.atStartOfDay();
        LocalDateTime endDate = startOfWeek.plusDays(7).atStartOfDay();

        return orderRepository.getCompletedSales(startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getMonthlySales(LocalDate date) {

        LocalDate startOfMonth = date.withDayOfMonth(1);

        LocalDateTime startDate = startOfMonth.atStartOfDay();
        LocalDateTime endDate = startOfMonth.plusMonths(1).atStartOfDay();

        return orderRepository.getCompletedSales(startDate, endDate);
    }
    @Override
    @Transactional(readOnly = true)
    public Long getCompletedOrderCount(LocalDate date) {

        LocalDateTime startDate = date.atStartOfDay();
        LocalDateTime endDate = date.plusDays(1).atStartOfDay();

        return orderRepository.countCompletedOrders(startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAverageOrderValue(LocalDate date) {

        BigDecimal totalSales = getDailySales(date);
        Long orderCount = getCompletedOrderCount(date);

        if (orderCount == 0) {
            return BigDecimal.ZERO;
        }

        return totalSales.divide(
                BigDecimal.valueOf(orderCount),
                2,
                java.math.RoundingMode.HALF_UP
        );
    }

}
