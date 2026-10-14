package restaurant_management.service.impl;

import restaurant_management.entity.RestaurantTable;
import restaurant_management.enums.TableStatus;
import restaurant_management.repository.RestaurantTableRepository;
import restaurant_management.service.RestaurantTableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;

    public RestaurantTableServiceImpl(RestaurantTableRepository restaurantTableRepository) {
        this.restaurantTableRepository = restaurantTableRepository;
    }

    @Override
    public RestaurantTable createTable(RestaurantTable restaurantTable) {
        if (restaurantTable.getTableNumber() == null || restaurantTable.getTableNumber() <= 0) {
            throw new IllegalArgumentException("Table number must be greater than zero");
        }

        if (restaurantTable.getCapacity() == null || restaurantTable.getCapacity() <= 0) {
            throw new IllegalArgumentException("Table capacity must be greater than zero");
        }

        if (restaurantTableRepository.existsByTableNumber(restaurantTable.getTableNumber())) {
            throw new IllegalArgumentException("Table number already exists");
        }

        restaurantTable.setId(null);
        restaurantTable.setStatus(TableStatus.AVAILABLE);

        return restaurantTableRepository.save(restaurantTable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTable> getAllTables() {
        return restaurantTableRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantTable getTableById(Long id) {
        return restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found with id: " + id));
    }

    @Override
    public RestaurantTable updateTable(Long id, RestaurantTable updatedTable) {
        RestaurantTable existingTable = getTableById(id);

        if (updatedTable.getTableNumber() == null || updatedTable.getTableNumber() <= 0) {
            throw new IllegalArgumentException("Table number must be greater than zero");
        }

        if (updatedTable.getCapacity() == null || updatedTable.getCapacity() <= 0) {
            throw new IllegalArgumentException("Table capacity must be greater than zero");
        }

        restaurantTableRepository.findByTableNumber(updatedTable.getTableNumber())
                .filter(table -> !table.getId().equals(id))
                .ifPresent(table -> {
                    throw new IllegalArgumentException("Table number already exists");
                });

        existingTable.setTableNumber(updatedTable.getTableNumber());
        existingTable.setCapacity(updatedTable.getCapacity());

        return restaurantTableRepository.save(existingTable);
    }

    @Override
    public void deleteTable(Long id) {
        RestaurantTable existingTable = getTableById(id);
        restaurantTableRepository.delete(existingTable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTable> getTablesByStatus(TableStatus status) {
        return restaurantTableRepository.findByStatus(status);
    }
}

