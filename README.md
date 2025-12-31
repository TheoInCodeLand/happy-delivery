mobile-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── welcome.tsx
│   ├── (customer)/
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   └── restaurant-details.tsx
│   │   ├── search/
│   │   │   └── index.tsx
│   │   ├── cart/
│   │   │   └── index.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── tracking.tsx
│   │   ├── profile/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── (driver)/
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── earnings/
│   │   │   └── index.tsx
│   │   ├── profile/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── (manager)/
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── restaurants/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   ├── create.tsx
│   │   │   └── menus/
│   │   │       ├── index.tsx
│   │   │       └── [id].tsx
│   │   ├── orders/
│   │   │   └── index.tsx
│   │   ├── analytics/
│   │   │   └── index.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Loader.tsx
│   │   └── Modal.tsx
│   ├── customer/
│   │   ├── RestaurantCard.tsx
│   │   ├── MenuItem.tsx
│   │   ├── CartItem.tsx
│   │   └── OrderCard.tsx
│   ├── driver/
│   │   ├── OrderCard.tsx
│   │   └── EarningsCard.tsx
│   └── manager/
│       ├── RestaurantCard.tsx
│       └── OrderCard.tsx
├── constants/
│   ├── colors.ts
│   ├── api.ts
│   └── config.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useLocation.ts
│   ├── useSocket.ts
│   └── useNotifications.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── restaurant.ts
│   ├── order.ts
│   ├── driver.ts
│   └── notification.ts
├── store/
│   ├── authStore.ts
│   ├── cartStore.ts
│   ├── orderStore.ts
│   └── index.ts
├── utils/
│   ├── helpers.ts
│   ├── validators.ts
│   └── notifications.ts
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .env
├── app.json
├── package.json
└── tsconfig.json