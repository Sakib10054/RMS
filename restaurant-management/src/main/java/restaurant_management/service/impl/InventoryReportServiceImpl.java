package restaurant_management.service.impl;

import restaurant_management.entity.Inventory;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.service.InventoryReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InventoryReportServiceImpl
        implements InventoryReportService {

    private final InventoryRepository inventoryRepository;

    public InventoryReportServiceImpl(
            InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Inventory> getInventoryReport() {
        return inventoryRepository.findAll();
    }
}