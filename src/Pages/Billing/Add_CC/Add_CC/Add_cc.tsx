import { useNavigate } from 'react-router-dom';
import CompanyForm from '../Business/Business';
import { createBusiness } from '../../../../api/business.ts';
import { addCustomer } from '../../../../api/customer.ts';
import './Add_cc.css';

const AddCC = () => {
    const navigate = useNavigate();

    const handleSave = async (data: any) => {
        console.log("Saving Data:", data);

        try {
            if (data.type === 'company') {
                // Map frontend CompanyForm data to backend business expectations
                const payload = {
                    business_name: data.companyName,
                    primary_category_id: 1, // Mock or add to form
                    additional_data: {
                        gst: data.gstNumber,
                        email: data.email,
                        phone: data.phone,
                        address: data.address
                    }
                };
                await createBusiness(payload);
                alert('Company added successfully! It will now appear in your Billing options.');
            } else {
                // Map frontend CustomerForm data to backend customer expectations
                const payload = {
                    name: data.companyName || 'Unnamed Customer',
                    email: data.email,
                    mobile: data.phone,
                    address: data.address,
                    type: 'customer'
                };
                await addCustomer(payload);
                alert('Customer added successfully!');
            }

            navigate('/billing/create');
        } catch (error) {
            console.error("Save Error:", error);
            alert('Failed to save data. Please check backend connection.');
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="add-cc-page-wrapper">
            {/* Reusing CompanyForm which handles both Customer and Company via tabs */}
            <CompanyForm
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default AddCC;
