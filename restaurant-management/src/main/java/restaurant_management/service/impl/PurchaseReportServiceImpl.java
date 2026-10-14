package restaurant_management.service.impl;

import restaurant_management.entity.Purchase;
import restaurant_management.repository.PurchaseRepository;
import restaurant_management.service.PurchaseReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PurchaseReportServiceImpl implements PurchaseReportService {

    private final PurchaseRepository purchaseRepository;

    public PurchaseReportServiceImpl(PurchaseRepository purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Purchase> getPurchasesByDateRange(
            LocalDate from,
            LocalDate to) {

        return purchaseRepository.findByPurchaseDateBetween(
                from,
                to
        );
    }
}