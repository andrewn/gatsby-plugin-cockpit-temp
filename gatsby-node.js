const CockpitSDK = require('cockpit-sdk').default;
const { AssetMapHelpers, CockpitHelpers, CreateNodesHelpers } = require('./helpers');
const extendNodeType = require('./extend-node-type');
const itemsStore = require('./items-store');

exports.sourceNodes = async ({
  actions: { createNode },
  createNodeId,
  store,
  cache,
}, pluginOptions) => {
  const defaultConfig = {
    baseURL: '',
    folder: '',
    accessToken: '',
    sanitizeHtmlConfig: {},    
    customComponents: [],
  }
  
  const config = Object.assign(defaultConfig, pluginOptions.cockpitConfig);
  const host = config.baseURL + config.folder;

  const cockpit = new CockpitSDK({
    host,
    accessToken: config.accessToken,
  });

  const cockpitHelpers = new CockpitHelpers(cockpit, config);
  const collectionsNames = await cockpitHelpers.getCollectionNames();

  const [{ assets }, collectionsItems, singletonsItems, regionsItems] = await Promise.all([
    cockpit.assets(), 
    cockpitHelpers.getCockpitCollections(),
    cockpitHelpers.getCockpitSingletons(),
    cockpitHelpers.getCockpitRegions(),
  ]);

  assets.forEach(asset => asset.path = host + '/storage/uploads' + asset.path);

  itemsStore.set('collectionsItems', collectionsItems);
  itemsStore.set('regionsItems', regionsItems);
  itemsStore.set('collectionsNames', collectionsNames);
  itemsStore.set('singletonsItems', singletonsItems);

  const assetMapHelpers = new AssetMapHelpers({
    assets,
    store,
    cache,
    createNode,
    createNodeId,
    collectionsItems,
    singletonsItems,
    config,
  });

  const assetsMap = await assetMapHelpers.createAssetsNodes();

  const createNodesHelpers = new CreateNodesHelpers({
    collectionsItems,
    singletonsItems,
    regionsItems,
    store,
    cache,
    createNode,
    assetsMap,
    config,
  });

  await createNodesHelpers.createItemsNodes();
};

exports.setFieldsOnGraphQLNodeType = extendNodeType;
