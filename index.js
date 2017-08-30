import api from './server/routes';

export default function (kibana) {
  //查看autoload目录是否定义
  var mainFile = 'plugins/elasticsearch_status/app';

  var ownDescriptor = Object.getOwnPropertyDescriptor(kibana, 'autoload');
  var protoDescriptor = Object.getOwnPropertyDescriptor(kibana.constructor.prototype, 'autoload');
  var descriptor = ownDescriptor || protoDescriptor || {};
  if (descriptor.get) {
    // the autoload list has been replaced with a getter that complains about
    // improper access, bypass that getter by seeing if it is defined
    mainFile = 'plugins/elasticsearch_status/app_with_autoload';
  }

  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {
      // Register the app component of our plugin to uiExports
      app: {
        // The title of the app (will be shown to the user)
        title: 'Indices',
		hidden: true,
        // An description of the application.
        description: 'An awesome Kibana plugin',
        // The require reference to the JavaScript file for this app
        //main: 'plugins/elasticsearch_status/app',
		main: mainFile,
        // The require reference to the icon of the app
        icon: 'plugins/elasticsearch_status/icon.svg'
      }
    },

    // The init method will be executed when the Kibana server starts and loads
    // this plugin. It is used to set up everything that you need.
    init(server, options) {
      // Just call the api module that we imported above (the server/routes.js file)
      // and pass the server to it, so it can register several API interfaces at the server.
      api(server);
    }

  });
};
