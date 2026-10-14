package restaurant_management.service;

import restaurant_management.entity.RestaurantTable;
import restaurant_management.enums.TableStatus;

import java.util.List;

public interface RestaurantTableService {

    RestaurantTable createTable(RestaurantTable restaurantTable);

    List<RestaurantTable> getAllTables();

    RestaurantTable getTableById(Long id);

    RestaurantTable updateTable(Long id, RestaurantTable restaurantTable);

    void deleteTable(Long id);

    List<RestaurantTable> getTablesByStatus(TableStatus status);
}

