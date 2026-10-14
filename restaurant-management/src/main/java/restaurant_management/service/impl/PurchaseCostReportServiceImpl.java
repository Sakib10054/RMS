package restaurant_management.service.impl;

import restaurant_management.repository.PurchaseRepository;
import restaurant_management.service.PurchaseCostReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@Transactional
public class PurchaseCostReportServiceImpl
        implements PurchaseCostReportService {

    private final PurchaseRepository purchaseRepository;

    public PurchaseCostReportServiceImpl(
            PurchaseRepository purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPurchaseCost(
            LocalDate from,
            LocalDate to) {

        return purchaseRepository.getTotalPurchaseCost(from, to);
    }
}