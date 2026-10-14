package restaurant_management.service.impl;

import restaurant_management.entity.Inventory;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.service.LowStockReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LowStockReportServiceImpl
        implements LowStockReportService {

    private final InventoryRepository inventoryRepository;

    public LowStockReportServiceImpl(
            InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Inventory> getLowStockInventory() {
        return inventoryRepository.findLowStockInventory();
    }
}