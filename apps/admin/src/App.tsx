import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { BannersPage } from './pages/BannersPage';
import { SectionsPage } from './pages/SectionsPage';
import { CrudResourcePage } from './pages/CrudResourcePage';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm">Loading...</div>;
  }
  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/banners" element={<BannersPage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route
          path="/categories"
          element={
            <CrudResourcePage
              title="Categories"
              endpoint="/admin/categories"
              previewType="tile"
              columns={[
                { key: 'imageUrl', label: 'Image', isImage: true },
                { key: 'name', label: 'Name' },
                { key: 'slug', label: 'Slug' },
                { key: 'displayOrder', label: 'Order' },
                { key: 'isPublished', label: 'Published' },
              ]}
              toggleField={{ key: 'isPublished', label: 'Visibility' }}
              createFields={[
                { key: 'name', label: 'Category Name', required: true },
                { key: 'slug', label: 'Slug', required: true },
                { key: 'imageUrl', label: 'Category Image', type: 'image', recommendedSize: '900 × 1200 px' },
                { key: 'bannerUrl', label: 'Category Banner Image', type: 'image', recommendedSize: '1800 × 500 px' },
                { key: 'description', label: 'Description' },
                { key: 'displayOrder', label: 'Display Order', type: 'number' },
              ]}
            />
          }
        />
        <Route
          path="/collections"
          element={
            <CrudResourcePage
              title="Collections"
              endpoint="/admin/collections"
              previewType="tile"
              columns={[
                { key: 'imageUrl', label: 'Image', isImage: true },
                { key: 'name', label: 'Name' },
                { key: 'slug', label: 'Slug' },
                { key: 'isFeatured', label: 'Featured' },
                { key: 'isPublished', label: 'Published' },
              ]}
              toggleField={{ key: 'isPublished', label: 'Visibility' }}
              createFields={[
                { key: 'name', label: 'Collection Name', required: true },
                { key: 'slug', label: 'Slug', required: true },
                { key: 'imageUrl', label: 'Collection Tile Image', type: 'image', recommendedSize: '900 × 1125 px (4:5)' },
                { key: 'bannerUrl', label: 'Collection Banner Image', type: 'image', recommendedSize: '1800 × 500 px' },
                { key: 'description', label: 'Description' },
              ]}
            />
          }
        />
        <Route
          path="/offers"
          element={
            <CrudResourcePage
              title="Prices & Offers"
              endpoint="/admin/offers"
              columns={[
                { key: 'productId', label: 'Product ID' },
                { key: 'offerPriceNpr', label: 'Offer Price (NPR)' },
                { key: 'startsAt', label: 'Starts' },
                { key: 'endsAt', label: 'Ends' },
                { key: 'isActive', label: 'Active' },
              ]}
              createFields={[
                { key: 'productId', label: 'Product ID', required: true },
                { key: 'offerPriceNpr', label: 'Offer Price (NPR)', type: 'number', required: true },
              ]}
            />
          }
        />
        <Route
          path="/coupons"
          element={
            <CrudResourcePage
              title="Coupons"
              endpoint="/admin/coupons"
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'discountType', label: 'Type' },
                { key: 'discountValue', label: 'Value' },
                { key: 'minOrderNpr', label: 'Min Order' },
                { key: 'usedCount', label: 'Used' },
                { key: 'isActive', label: 'Active' },
              ]}
              toggleField={{ key: 'isActive', label: 'Status' }}
              createFields={[
                { key: 'code', label: 'Coupon Code', required: true },
                { key: 'discountType', label: 'Discount Type', type: 'select', options: ['percentage', 'fixed'] },
                { key: 'discountValue', label: 'Discount Value', type: 'number', required: true },
                { key: 'minOrderNpr', label: 'Min Order (NPR)', type: 'number' },
              ]}
            />
          }
        />
        <Route
          path="/instagram"
          element={
            <CrudResourcePage
              title="Instagram Feed (@matina.clo)"
              endpoint="/admin/instagram"
              previewType="instagram"
              columns={[
                { key: 'mediaUrl', label: 'Image', isImage: true },
                { key: 'caption', label: 'Caption' },
                { key: 'permalink', label: 'Link' },
                { key: 'source', label: 'Source' },
                { key: 'isActive', label: 'Active' },
              ]}
              createFields={[
                { key: 'mediaUrl', label: 'Post Image', type: 'image', required: true, recommendedSize: '1080 × 1080 px (1:1)' },
                { key: 'permalink', label: 'Instagram Post URL', required: true },
                { key: 'caption', label: 'Caption' },
              ]}
            />
          }
        />
        <Route
          path="/customers"
          element={
            <CrudResourcePage
              title="Customers"
              endpoint="/admin/customers"
              allowCreate={false}
              columns={[
                { key: 'fullName', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
                { key: 'createdAt', label: 'Joined' },
              ]}
            />
          }
        />
        <Route
          path="/shipping"
          element={
            <CrudResourcePage
              title="Shipping / Delivery Rules"
              endpoint="/admin/shipping-rules"
              columns={[
                { key: 'name', label: 'Rule Name' },
                { key: 'ruleType', label: 'Type' },
                { key: 'district', label: 'District' },
                { key: 'feeNpr', label: 'Fee (NPR)' },
                { key: 'freeShippingThresholdNpr', label: 'Free Above (NPR)' },
              ]}
              createFields={[
                { key: 'name', label: 'Rule Name', required: true },
                { key: 'ruleType', label: 'Type', type: 'select', options: ['flat', 'province', 'district'] },
                { key: 'province', label: 'Province' },
                { key: 'district', label: 'District' },
                { key: 'feeNpr', label: 'Fee (NPR)', type: 'number', required: true },
                { key: 'freeShippingThresholdNpr', label: 'Free Above (NPR)', type: 'number' },
              ]}
            />
          }
        />
        <Route
          path="/pages"
          element={
            <CrudResourcePage
              title="Website Content / Pages"
              endpoint="/admin/pages"
              columns={[
                { key: 'coverImageUrl', label: 'Cover', isImage: true },
                { key: 'title', label: 'Title' },
                { key: 'slug', label: 'Slug' },
                { key: 'pageType', label: 'Type' },
                { key: 'isPublished', label: 'Published' },
              ]}
              toggleField={{ key: 'isPublished', label: 'Publish' }}
              createFields={[
                { key: 'pageType', label: 'Page Type', type: 'select', options: ['journal', 'story', 'faq', 'policy'] },
                { key: 'title', label: 'Title', required: true },
                { key: 'slug', label: 'Slug', required: true },
                { key: 'coverImageUrl', label: 'Cover Image', type: 'image', recommendedSize: '1400 × 800 px' },
                { key: 'excerpt', label: 'Excerpt' },
              ]}
            />
          }
        />
        <Route
          path="/users"
          element={
            <CrudResourcePage
              title="Admin Users & Permissions"
              endpoint="/admin/users"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
                { key: 'isActive', label: 'Active' },
              ]}
              toggleField={{ key: 'isActive', label: 'Status' }}
              createFields={[
                { key: 'name', label: 'Full Name', required: true },
                { key: 'email', label: 'Email', required: true },
                { key: 'password', label: 'Password', required: true },
                { key: 'role', label: 'Role', type: 'select', options: ['manager', 'order_staff', 'content_staff', 'super_admin'] },
              ]}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <CrudResourcePage
              title="Site Settings"
              endpoint="/admin/settings"
              allowCreate={false}
              columns={[
                { key: 'key', label: 'Setting Key' },
                { key: 'valueJson', label: 'Value' },
              ]}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
