package restaurant_management.service;

import restaurant_management.entity.StockMovement;

import java.time.LocalDate;
import java.util.List;

public interface StockMovementReportService {

    List<StockMovement> getMovementsByDateRange(
            LocalDate from,
            LocalDate to
    );
}