const axios = require('axios');

class FShipService {
    constructor() {
        this.stagingUrl = 'https://capi-qc.fship.in';
        this.productionUrl = 'https://capi.fship.in';
        // Staging key from F-Ship documentation
        this.stagingKey = process.env.FSHIP_STAGING_KEY || '085c36066064af83c66b9dbf44d190d40feec79f437bc1c1cb';
        this.productionKey = process.env.FSHIP_PRODUCTION_KEY;
        this.isProduction = process.env.NODE_ENV === 'production';
        this.baseUrl = this.isProduction ? this.productionUrl : this.stagingUrl;
        this.apiKey = this.isProduction ? this.productionKey : this.stagingKey;
        
        // Default warehouse ID (should be set after creating warehouse in F-Ship)
        this.defaultWarehouseId = process.env.FSHIP_DEFAULT_WAREHOUSE_ID || 0;
    }

    // Helper method to make API calls - Using 'signature' header as per F-Ship API docs
    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'signature': this.apiKey  // F-Ship uses 'signature' header for authentication
                }
            };

            if (data && method !== 'GET') {
                config.data = data;
            }

            console.log(`F-Ship API Request: ${method} ${endpoint}`, data ? JSON.stringify(data) : '');
            
            const response = await axios(config);
            
            console.log(`F-Ship API Response: ${endpoint}`, JSON.stringify(response.data));
            
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error(`F-Ship API Error (${endpoint}):`, error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status || 500
            };
        }
    }

    // ==================== COURIER MANAGEMENT ====================
    
    // Get all available couriers from F-Ship
    async getAllCouriers() {
        return await this.makeRequest('/api/getallcourier', 'GET');
    }

    // ==================== WAREHOUSE MANAGEMENT ====================
    
    // Add a new warehouse/pickup location
    async addWarehouse(warehouseData) {
        const payload = {
            warehouseId: warehouseData.warehouseId || 0,
            warehouseName: warehouseData.warehouseName,
            contactName: warehouseData.contactName,
            addressLine1: warehouseData.addressLine1,
            addressLine2: warehouseData.addressLine2 || '',
            pincode: warehouseData.pincode,
            city: warehouseData.city,
            stateId: warehouseData.stateId || 0,
            countryId: warehouseData.countryId || 1, // 1 for India
            phoneNumber: warehouseData.phoneNumber,
            email: warehouseData.email || ''
        };
        return await this.makeRequest('/api/addwarehouse', 'POST', payload);
    }

    // Update existing warehouse
    async updateWarehouse(warehouseData) {
        const payload = {
            warehouseId: warehouseData.warehouseId,
            warehouseName: warehouseData.warehouseName,
            contactName: warehouseData.contactName,
            addressLine1: warehouseData.addressLine1,
            addressLine2: warehouseData.addressLine2 || '',
            pincode: warehouseData.pincode,
            city: warehouseData.city,
            stateId: warehouseData.stateId || 0,
            countryId: warehouseData.countryId || 1,
            phoneNumber: warehouseData.phoneNumber,
            email: warehouseData.email || ''
        };
        return await this.makeRequest('/api/updatewarehouse', 'POST', payload);
    }

    // ==================== ORDER MANAGEMENT ====================
    
    // Create a forward order (ship to customer)
    async createForwardOrder(orderData) {
        // Build products array
        const products = orderData.products || [{
            productId: orderData.productId || '',
            productName: orderData.productName || 'Product',
            unitPrice: orderData.unitPrice || orderData.total_Amount || 0,
            quantity: orderData.quantity || 1,
            productCategory: orderData.productCategory || 'General',
            hsnCode: orderData.hsnCode || '',
            sku: orderData.sku || '',
            taxRate: orderData.taxRate || 0,
            productDiscount: orderData.productDiscount || 0
        }];

        const payload = {
            customer_Name: orderData.customer_Name,
            customer_Mobile: orderData.customer_Mobile,
            customer_Emailid: orderData.customer_Emailid || '',
            customer_Address: orderData.customer_Address,
            landMark: orderData.landMark || '',
            customer_Address_Type: orderData.customer_Address_Type || 'Home',
            customer_PinCode: orderData.customer_PinCode,
            customer_City: orderData.customer_City || '',
            orderId: orderData.orderId,
            invoice_Number: orderData.invoice_Number || orderData.orderId,
            payment_Mode: orderData.payment_Mode || 2, // 1=COD, 2=PREPAID
            express_Type: orderData.express_Type || 'surface', // 'air' or 'surface'
            is_Ndd: orderData.is_Ndd || 0, // Next Day Delivery: 1=Yes, 0=No
            order_Amount: orderData.order_Amount || 0,
            tax_Amount: orderData.tax_Amount || 0,
            extra_Charges: orderData.extra_Charges || 0,
            total_Amount: orderData.total_Amount,
            cod_Amount: orderData.cod_Amount || 0, // If COD order, set collectible amount
            shipment_Weight: orderData.shipment_Weight || 0.5, // Weight in Kgs
            shipment_Length: orderData.shipment_Length || 10, // Length in cms
            shipment_Width: orderData.shipment_Width || 10, // Width in cms
            shipment_Height: orderData.shipment_Height || 10, // Height in cms
            volumetric_Weight: orderData.volumetric_Weight || 0,
            latitude: orderData.latitude || 0,
            longitude: orderData.longitude || 0,
            pick_Address_ID: orderData.pick_Address_ID || parseInt(this.defaultWarehouseId),
            return_Address_ID: orderData.return_Address_ID || orderData.pick_Address_ID || parseInt(this.defaultWarehouseId),
            products: products,
            courierId: orderData.courierId || 0 // 0 = auto-select best courier
        };

        return await this.makeRequest('/api/createforwardorder', 'POST', payload);
    }

    // Create a reverse order (return pickup from customer)
    async createReverseOrder(orderData) {
        const products = orderData.products || [{
            productId: orderData.productId || '',
            productName: orderData.productName || 'Product',
            quantity: orderData.quantity || 1,
            unitPrice: orderData.unitPrice || 0,
            productCategory: orderData.productCategory || 'General',
            sku: orderData.sku || '',
            hsnCode: orderData.hsnCode || '',
            taxRate: orderData.taxRate || 0,
            productDiscount: orderData.productDiscount || 0,
            brandName: orderData.brandName || '',
            color: orderData.color || '',
            size: orderData.size || '',
            eanNo: orderData.eanNo || '',
            serialNo: orderData.serialNo || '',
            imei: orderData.imei || '',
            isFragileProduct: orderData.isFragileProduct || false,
            productImageUrl: orderData.productImageUrl || '',
            returnType: orderData.returnType || 0,
            returnReason: orderData.returnReason || '',
            qcParameters: orderData.qcParameters || []
        }];

        const payload = {
            customer_Name: orderData.customer_Name,
            customer_Mobile: orderData.customer_Mobile,
            customer_Emailid: orderData.customer_Emailid || '',
            customer_Address: orderData.customer_Address,
            landMark: orderData.landMark || '',
            customer_Address_Type: orderData.customer_Address_Type || 'Home',
            customer_PinCode: orderData.customer_PinCode,
            customer_City: orderData.customer_City || '',
            orderId: orderData.orderId,
            invoice_Number: orderData.invoice_Number || orderData.orderId,
            order_Amount: orderData.order_Amount || 0,
            tax_Amount: orderData.tax_Amount || 0,
            extra_Charges: orderData.extra_Charges || 0,
            total_Amount: orderData.total_Amount,
            pickUpAddressId: orderData.pickUpAddressId || parseInt(this.defaultWarehouseId),
            shipment_Weight: orderData.shipment_Weight || 0.5,
            shipment_Length: orderData.shipment_Length || 10,
            shipment_Width: orderData.shipment_Width || 10,
            shipment_Height: orderData.shipment_Height || 10,
            volumetric_Weight: orderData.volumetric_Weight || 0,
            products: products,
            isQcRequired: orderData.isQcRequired || false,
            courierId: orderData.courierId || 0,
            isTaxIncluded: orderData.isTaxIncluded || false
        };

        return await this.makeRequest('/api/createreverseorder', 'POST', payload);
    }

    // Cancel an order/shipment
    async cancelOrder(waybill, reason = '') {
        const payload = {
            waybill: waybill,
            reason: reason || 'Order cancelled'
        };
        return await this.makeRequest('/api/cancelorder', 'POST', payload);
    }

    // ==================== SHIPPING LABELS ====================
    
    // Get shipping label by waybill number(s)
    async getShippingLabel(waybill) {
        // Can pass comma-separated waybills for multiple labels
        return await this.makeRequest('/api/shippinglabel', 'POST', { waybill });
    }

    // Get shipping label by pickup order ID
    async getShippingLabelByPickupId(pickupOrderIds) {
        // pickupOrderIds should be an array of pickup order IDs
        const ids = Array.isArray(pickupOrderIds) ? pickupOrderIds : [pickupOrderIds];
        return await this.makeRequest('/api/shippinglabelbypickupid', 'POST', { pickupOrderId: ids });
    }

    // ==================== TRACKING ====================
    
    // Get full tracking history for a shipment
    async getTrackingHistory(waybill) {
        return await this.makeRequest('/api/trackinghistory', 'POST', { waybill });
    }

    // Get current/latest status of a shipment
    async getShipmentSummary(waybill) {
        return await this.makeRequest('/api/shipmentsummary', 'POST', { waybill });
    }

    // ==================== PICKUP MANAGEMENT ====================
    
    // Register pickup for one or more waybills
    async registerPickup(waybills) {
        // waybills should be an array of AWB numbers
        const waybillArray = Array.isArray(waybills) ? waybills : [waybills];
        return await this.makeRequest('/api/registerpickup', 'POST', { waybills: waybillArray });
    }

    // ==================== RATE CALCULATOR ====================
    
    // Calculate shipping rates
    async getRateCalculator(rateData) {
        const payload = {
            source_Pincode: rateData.source_Pincode || rateData.sourcePincode,
            destination_Pincode: rateData.destination_Pincode || rateData.destinationPincode,
            payment_Mode: rateData.payment_Mode || rateData.paymentMode || 'P', // 'COD' or 'P' (Prepaid)
            amount: rateData.amount || 0,
            express_Type: rateData.express_Type || rateData.expressType || 'surface', // 'air' or 'surface'
            shipment_Weight: rateData.shipment_Weight || rateData.weight || 0.5,
            shipment_Length: rateData.shipment_Length || rateData.length || 10,
            shipment_Width: rateData.shipment_Width || rateData.width || 10,
            shipment_Height: rateData.shipment_Height || rateData.height || 10,
            volumetric_Weight: rateData.volumetric_Weight || rateData.volumetricWeight || 0
        };
        return await this.makeRequest('/api/ratecalculator', 'POST', payload);
    }

    // ==================== PINCODE SERVICEABILITY ====================
    
    // Check if delivery is available to a pincode
    async checkPincodeServiceability(sourcePincode, destinationPincode) {
        const payload = {
            source_Pincode: sourcePincode,
            destination_Pincode: destinationPincode
        };
        return await this.makeRequest('/api/pincodeserviceability', 'POST', payload);
    }

    // ==================== RE-ATTEMPT / ACTIONS ====================
    
    // Re-attempt delivery or take action on exception
    // Actions: 're-attempt', 'change-address', 'change-phone', 'rto'
    async reattemptOrder(reattemptData) {
        const payload = {
            apiorderid: reattemptData.apiorderid,
            action: reattemptData.action || 're-attempt', // 're-attempt', 'change-address', 'change-phone', 'rto'
            reattempt_date: reattemptData.reattempt_date || new Date().toISOString(),
            contact_name: reattemptData.contact_name || '',
            complete_address: reattemptData.complete_address || '',
            landmark: reattemptData.landmark || '',
            mobilenumber: reattemptData.mobilenumber || '',
            remarks: reattemptData.remarks || ''
        };
        return await this.makeRequest('/api/reattemptorder', 'POST', payload);
    }

    // ==================== HELPER METHODS ====================
    
    // Parse shipping address string to get components
    parseShippingAddress(addressString) {
        // Try to parse address string into components
        // Expected format: "Name, Phone, Address Line 1, Address Line 2, Landmark: xxx, City, State - Pincode"
        const parts = addressString.split(',').map(p => p.trim());
        
        let name = '', phone = '', address = '', city = '', state = '', pincode = '', landmark = '';
        
        if (parts.length >= 1) name = parts[0];
        if (parts.length >= 2) phone = parts[1].replace(/\D/g, '').slice(-10);
        
        // Find pincode (6 digits at end)
        const pincodeMatch = addressString.match(/(\d{6})\s*$/);
        if (pincodeMatch) pincode = pincodeMatch[1];
        
        // Find state and city (usually last part before pincode)
        const lastPart = parts[parts.length - 1] || '';
        const cityStateMatch = lastPart.match(/([^-]+)\s*-\s*(\d{6})/);
        if (cityStateMatch) {
            const cityState = parts[parts.length - 2] || '';
            city = cityState;
        }
        
        // Find landmark
        const landmarkMatch = addressString.match(/Landmark:\s*([^,]+)/i);
        if (landmarkMatch) landmark = landmarkMatch[1].trim();
        
        // Everything else is address
        address = parts.slice(2, -1).filter(p => !p.toLowerCase().startsWith('landmark')).join(', ');
        
        return { name, phone, address, city, state, pincode, landmark };
    }

    // Build order data from internal order object
    buildOrderDataFromOrder(order, warehouse = null) {
        // Parse shipping address
        const parsed = this.parseShippingAddress(order.shippingAddress);
        
        // Build products array
        const products = (order.items || []).map(item => ({
            productId: item.product?._id?.toString() || '',
            productName: item.product?.title || item.customData?.type || 'Product',
            unitPrice: item.price || 0,
            quantity: item.quantity || 1,
            productCategory: item.product?.category || 'General',
            hsnCode: '',
            sku: item.product?.sku || '',
            taxRate: 0,
            productDiscount: 0
        }));

        return {
            customer_Name: parsed.name || order.user?.name || 'Customer',
            customer_Mobile: parsed.phone || order.user?.phone || '0000000000',
            customer_Emailid: order.user?.email || '',
            customer_Address: parsed.address || order.shippingAddress,
            landMark: parsed.landmark || '',
            customer_Address_Type: 'Home',
            customer_PinCode: parsed.pincode || '',
            customer_City: parsed.city || '',
            orderId: order._id.toString(),
            invoice_Number: order._id.toString(),
            payment_Mode: order.paymentMode === 'COD' ? 1 : 2,
            express_Type: order.expressType || 'surface',
            is_Ndd: order.isNdd ? 1 : 0,
            order_Amount: order.totalAmount || 0,
            tax_Amount: 0,
            extra_Charges: 0,
            total_Amount: order.totalAmount || 0,
            cod_Amount: order.paymentMode === 'COD' ? order.totalAmount : 0,
            shipment_Weight: order.shipmentWeight || 0.5,
            shipment_Length: order.shipmentLength || 10,
            shipment_Width: order.shipmentWidth || 10,
            shipment_Height: order.shipmentHeight || 10,
            volumetric_Weight: order.volumetricWeight || 0,
            latitude: 0,
            longitude: 0,
            pick_Address_ID: warehouse?.warehouseId || order.warehouseId || parseInt(this.defaultWarehouseId),
            return_Address_ID: warehouse?.warehouseId || order.warehouseId || parseInt(this.defaultWarehouseId),
            products: products,
            courierId: order.courierId || 0
        };
    }
}

module.exports = new FShipService();
