package restaurant_management.service;

import restaurant_management.entity.Inventory;

import java.util.List;

public interface LowStockReportService {

    List<Inventory> getLowStockInventory();
}