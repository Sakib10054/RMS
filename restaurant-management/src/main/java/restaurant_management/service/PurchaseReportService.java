package restaurant_management.service;

import restaurant_management.entity.Purchase;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseReportService {

    List<Purchase> getPurchasesByDateRange(
            LocalDate from,
            LocalDate to
    );
}