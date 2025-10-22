package com.example.customerservice.service;

import com.example.customerservice.dto.CustomerDTO;
import com.example.customerservice.mapper.CustomerMapper;
import com.example.customerservice.model.Customer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerMapper customerMapper;

    public List<CustomerDTO> getAllCustomers() {
        return customerMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        return convertToDTO(customer);
    }

    public CustomerDTO getCustomerByEmail(String email) {
        Customer customer = customerMapper.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
        return convertToDTO(customer);
    }

    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        if (customerMapper.existsByEmail(customerDTO.getEmail())) {
            throw new RuntimeException("Customer already exists with email: " + customerDTO.getEmail());
        }

        Customer customer = convertToEntity(customerDTO);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        customerMapper.insert(customer);
        return convertToDTO(customer);
    }

    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer customer = customerMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        if (!customer.getEmail().equals(customerDTO.getEmail()) &&
                customerMapper.existsByEmail(customerDTO.getEmail())) {
            throw new RuntimeException("Email already in use: " + customerDTO.getEmail());
        }

        customer.setName(customerDTO.getName());
        customer.setEmail(customerDTO.getEmail());
        customer.setPhoneNumber(customerDTO.getPhoneNumber());
        customer.setCompany(customerDTO.getCompany());
        customer.setUpdatedAt(LocalDateTime.now());

        customerMapper.update(customer);
        return convertToDTO(customer);
    }

    public void deleteCustomer(Long id) {
        if (!customerMapper.existsById(id)) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        customerMapper.deleteById(id);
    }

    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhoneNumber(customer.getPhoneNumber());
        dto.setCompany(customer.getCompany());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());
        return dto;
    }

    private Customer convertToEntity(CustomerDTO dto) {
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setCompany(dto.getCompany());
        return customer;
    }
}
