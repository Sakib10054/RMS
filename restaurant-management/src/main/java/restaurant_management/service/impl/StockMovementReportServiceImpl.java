package restaurant_management.service.impl;

import restaurant_management.entity.StockMovement;
import restaurant_management.repository.StockMovementRepository;
import restaurant_management.service.StockMovementReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class StockMovementReportServiceImpl
        implements StockMovementReportService {

    private final StockMovementRepository stockMovementRepository;

    public StockMovementReportServiceImpl(
            StockMovementRepository stockMovementRepository) {
        this.stockMovementRepository = stockMovementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovement> getMovementsByDateRange(
            LocalDate from,
            LocalDate to) {

        return stockMovementRepository.findByMovementDateRange(
                from.atStartOfDay(),
                to.plusDays(1).atStartOfDay()
        );
    }
}