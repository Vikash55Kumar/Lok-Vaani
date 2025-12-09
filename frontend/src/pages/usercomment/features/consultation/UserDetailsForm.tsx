import React, { useState, useEffect } from "react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

// Interface for company data from API
interface CompanyData {
  id: string;
  name: string;
  uniNumber: string;
  state: string;
  businessCategoryId?: string;
  categoryName?: string;
  [key: string]: any; // Allow additional fields from API
}

interface UserDetailsFormProps {
  onSubmit: (data: any, companyData: CompanyData | null) => void;
}

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    representing: "organization",
    orgName: "",
    industry: "",
    email: "",
    uin: "",
    address1: "",
    address2: "",
    country: "India",
    pinCode: "",
    city: "",
    state: "",
    mobile: "",
  });

  const [loading, setLoading] = useState(false);
  // Store full company data from API for POST request
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/companies/all-companies`
        );
        const result = await response.json();
        const data = result.data;

        if (Array.isArray(data) && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          const company = data[randomIndex];

          // Store the full company object for later use in POST API
          setCompanyData(company);

          setFormData((prev) => ({
            ...prev,
            orgName: company.name || "",
            uin: company.uniNumber || "",
            state: company.state || "",
            // Reset other fields as we are not using mock data
            industry: "",
            email: "",
            address1: "",
            address2: "",
            country: "India",
            pinCode: "",
            city: "",
            mobile: "",
          }));
        }
      } catch (error) {
        console.error("Failed to fetch company data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formData.representing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, companyData);
  };

  const isIndividual = formData.representing === "individual";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            You represent yourself as
          </label>
          <Select
            name="representing"
            value={formData.representing}
            onChange={handleChange}
            options={[
              { value: "organization", label: "Organisation" },
              { value: "individual", label: "Individual" },
            ]}
          />
        </div>

        {/* Name Field - Dynamic Label */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isIndividual ? "Name *" : "Name of the Organisation *"}
          </label>
          <Input
            name="orgName"
            value={formData.orgName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Mobile Field - Only for Individual */}
        {isIndividual && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Mobile Number *
            </label>
            <Input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {/* Industry - Only for Organisation */}
        {!isIndividual && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Select Industry of operation *
            </label>
            <Select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              options={[
                { value: "", label: "Select Industry" },
                { value: "tech", label: "Technology" },
                { value: "finance", label: "Finance" },
                { value: "legal", label: "Legal" },
              ]}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isIndividual ? "Email Address *" : "Organisation Email Address *"}
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* UIN - Only for Organisation */}
        {!isIndividual && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              UIN of Organisation *
            </label>
            <Input
              name="uin"
              value={formData.uin}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {/* Address 1 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isIndividual ? "Address *" : "Address of Organisation line 1 *"}
          </label>
          <Input
            name="address1"
            value={formData.address1}
            onChange={handleChange}
            required
          />
        </div>

        {/* Address 2 - Only for Organisation */}
        {!isIndividual && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Address of Organisation line 2
            </label>
            <Input
              name="address2"
              value={formData.address2}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Country */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Select Country *
          </label>
          <Select
            name="country"
            value={formData.country}
            onChange={handleChange}
            options={[
              { value: "India", label: "India" },
              { value: "USA", label: "USA" },
              { value: "UK", label: "UK" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Pin Code *
            </label>
            <Input
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              City *
            </label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* State - Only for Organisation */}
        {!isIndividual && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              State *
            </label>
            <Input
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-4"
        size="md"
        disabled={loading}
      >
        {loading ? "Loading..." : "Final Submit"}
      </Button>
    </form>
  );
};

export default UserDetailsForm;
