const { createRemoteFileNode } = require(`gatsby-source-filesystem`);
const validUrl = require('valid-url');

async function createRemoteAssetByPath(url, store, cache, createNode, createNodeId) {
  const remoteFileNode = await createRemoteFileNode({
    url,
    store,
    cache,
    createNode,
    createNodeId
  })

  if (remoteFileNode == null) {
    throw new Error(`Can't create remoteFileNode: ${url}`)
  }

  return {
    url,
    id: remoteFileNode.id,
    ext: remoteFileNode.ext,
    name: remoteFileNode.name,
    contentDigest: remoteFileNode.internal.contentDigest,
  }
}

async function createAssetsMap(assetPromises) {
  const allResults = await Promise.all(assetPromises);
  return allResults.reduce(
    (acc, { url, id }) => ({
      ...acc,
      [url]: id,
    }),
    {}
  );
}

class AssetMapHelpers {
  constructor({ assets, store, cache, createNode, createNodeId, collectionsItems, singletonsItems, config }) {
    this.assets = assets;
    this.store = store;
    this.cache = cache;
    this.createNode = createNode;
    this.createNodeId = createNodeId;
    this.collectionsItems = collectionsItems;
    this.singletonsItems = singletonsItems;
    this.config = config;
    this.config.host = config.baseURL + config.folder;
  }

  addImagePathToAssetsArray(field) {
    if (field && field.path) {
      let path = field.path;
      if (!validUrl.isUri(path)) {
        // This creates an incorrect URL since
        // cockpit seems to return a path including
        // the folder and a leadig slash
        // e.g. /cockpit/uploads/storage/...
        //
        // path = this.config.host + '/' + path;
        path = this.config.baseURL + path;
      }
      if (validUrl.isUri(path)) {
        this.assets.push({
          path,
        });
      } else {
        throw new Error(
          'The path of an image seems to be malformed -> ',
          path
        );
      }
    }
  }

  addAllOtherImagesPathsToAssetsArray() {
    this.collectionsItems.map(({ entries, fields }) => {
      const imageFields = Object.keys(fields).filter(
        fieldname => fields[fieldname].type === 'image'
      );
      imageFields.forEach(fieldname => {
        entries.forEach(entry => {
          this.addImagePathToAssetsArray(entry[fieldname]);
        });
      });

      // Galleries are composed of images
      const galleryFields = Object.keys(fields).filter(
        fieldname => fields[fieldname].type === 'gallery'
      );
      galleryFields.forEach(fieldname => {
        entries.forEach(entry => {
          if (entry[fieldname] && Array.isArray(entry[fieldname])) {
            entry[fieldname].forEach(
              field => this.addImagePathToAssetsArray(field)
            )
          }
        })
      })
    });

    
    this.singletonsItems.map(({ entry, fields }) => {
      // Find fields that are of type image and fetch from singleton
      Object.values(fields).filter(
        field => field.type === 'image'
      ).forEach(
        (field) => {
          const value = entry[field.name];
          if (value != null) {
            this.addImagePathToAssetsArray(value)
          }
        }
      );

      // Galleries are composed of images
      Object.values(fields).filter(
        field => field.type === 'gallery'
      ).forEach(
        field => {
          const value = entry[field.name];
          if (value && Array.isArray(value)) {
              value.forEach(
                item => this.addImagePathToAssetsArray(item)
              )
          }
        }
      );
  
    });
  }

  // gets all assets and adds them as file nodes
  // returns a map of url => node id
  async createAssetsNodes() {
    this.addAllOtherImagesPathsToAssetsArray();

    const allRemoteAssetsPromises = this.assets.map(asset =>
      createRemoteAssetByPath(
        asset.path,
        this.store,
        this.cache,
        this.createNode,
        this.createNodeId
      )
    );

    const finalAssetsMap = await createAssetsMap(allRemoteAssetsPromises);
    return finalAssetsMap;
  }
}

module.exports = {
  AssetMapHelpers,
  createAssetsMap,
};
