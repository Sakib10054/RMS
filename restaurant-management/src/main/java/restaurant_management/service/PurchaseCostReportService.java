package restaurant_management.service;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PurchaseCostReportService {

    BigDecimal getTotalPurchaseCost(
            LocalDate from,
            LocalDate to
    );
}