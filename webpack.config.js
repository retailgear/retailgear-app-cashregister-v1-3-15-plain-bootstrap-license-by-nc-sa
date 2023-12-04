const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, 'tsconfig.json'),
  [/* mapped paths to share */]);

const sharedLibrary = {
  "@angular/core": { singleton: true, requiredVersion: 'auto' },
  "@angular/common": { singleton: true, requiredVersion: 'auto' },
  "@angular/common/http": { singleton: true, requiredVersion: 'auto' },
  "@angular/router": { singleton: true, requiredVersion: 'auto' },
  "@ngx-translate/core": { singleton: true, requiredVersion: 'auto' },

  ...sharedMappings.getDescriptors()
};

module.exports = {
  output: {
    uniqueName: "cashRegister",
    publicPath: "auto"
  },
  optimization: {
    runtimeChunk: false
  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  plugins: [
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "jsonEditor",
      filename: "jsonEditor.js",
      exposes: {
        './jsonEditorModule': './src/app/json-editor/json-editor.module.ts',
      },

      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "till",
      filename: "till.js",
      exposes: {
        './TillModule': './src/app/till/till.module.ts',
      },

      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "tillSettings",
      filename: "till-settings.js",
      exposes: {
        './TillSettingsModule': './src/app/till-settings/till-settings.module.ts'
      },

      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "printSettings",
      filename: "print-settings.js",
      exposes: {
        './PrintSettingsModule': './src/app/print-settings/print-settings.module.ts'
      },

      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "savingPoints",
      filename: "saving-points.js",
      exposes: {
        './SavingPointsModule': './src/app/saving-points/saving-points.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "fiskalySettings",
      filename: "fiskaly-settings.js",
      exposes: {
        './FiskalySettingsModule': './src/app/fiskaly-settings/fiskaly-settings.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "workStation",
      filename: "work-station.js",
      exposes: {
        './WorkstationModule': './src/app/workstation/workstation.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "service",
      filename: "service.js",
      exposes: {
        './ServicesModule': './src/app/services/services.module.ts'
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "device",
      filename: "device.js",
      exposes: {
        './DeviceModule': './src/app/device/device.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "transaction",
      filename: "transaction.js",
      exposes: {
        './TransactionsModule': './src/app/transactions/transactions.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "webOrder",
      filename: "web-order.js",
      exposes: {
        './WebOrderModule': './src/app/web-orders/web-orders.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "statistics",
      filename: "statistics.js",
      exposes: {
        './StatisticModule': './src/app/statistics/statistics.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "activityItem",
      filename: "activity-item.js",
      exposes: {
        './ActivityItemsModule': './src/app/activity-items/activity-items.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "customer",
      filename: "customer.js",
      exposes: {
        './CustomerModule': './src/app/customers/customers.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "webshopSettings",
      filename: "webshop-settings.js",
      exposes: {
        './WebshopSettingsModule': './src/app/webshop-settings/webshop-settings.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "sharedService",
      filename: "shared-service.js",
      exposes: {
        './SharedServiceModule': './src/app/shared/shared-service.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "transactionAudit",
      filename: "transaction-audit.js",
      exposes: {
        './TransactionAuditModule': './src/app/transaction-audit/transaction-audit.module.ts'
      },
      shared: share(sharedLibrary)
    }),
    new ModuleFederationPlugin({
      // For remotes (please adjust)
      name: "dayClosure",
      filename: "day-closure.js",
      exposes: {
        './DayClosureModule': './src/app/day-closure/day-closure.module.ts',
      },
      shared: share(sharedLibrary)
    }),
    // new ModuleFederationPlugin({
    //   // For remotes (please adjust)
    //   remotes: {
    //     "supplierSlider": "supplierSlider@http://localhost:4202/supplierSlider.js",
    //   },
    //   shared: share(sharedLibrary)
    // }),
    sharedMappings.getPlugin()
  ],
};
