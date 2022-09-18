// const copydir = require('copy-dir');
const fs = require('fs');

// copydir(
//   'src/@brand/@custom/assets',
//   'src/assets',
//   {
//     utimes: true, // keep add time and modify time
//     mode: true, // keep file mode
//     cover: true, // cover file when exists, default is true
//   },
//   function (err) {
//     if (err) throw err;
//     console.log('Folder copied: assets');
//   }
// );

fs.copyFile('src/@brand/@custom/agent/angular.json', 'angular.json', (err) => {
  if (err) {
    console.log('Error Found:', err);
  } else {
    console.log('File copied: angular.json');
  }
});

fs.copyFile('src/@brand/@custom/Dockerfile', 'Dockerfile', (err) => {
  if (err) {
    console.log('Error Found:', err);
  } else {
    console.log('File copied: Dockerfile');
  }
});

fs.copyFile(
  'src/@brand/@custom/agent/proxy.conf.js',
  'proxy.conf.js',
  (err) => {
    if (err) {
      fs.copyFile(
        'src/@brand/@custom/proxy.conf.js',
        'proxy.conf.js',
        (err) => {
          if (err) {
            fs.copyFile(
              'src/@brand/@default/proxy.conf.js',
              'proxy.conf.js',
              (err) => {
                if (err) {
                  console.log('Error Found:', err);
                } else {
                  console.log('File copied: proxy.conf.js');
                }
              }
            );
          } else {
            console.log('File copied: proxy.conf.js');
          }
        }
      );
    } else {
      console.log('File copied: proxy.conf.js');
    }
  }
);

fs.copyFile(
  'src/@brand/@custom/agent/shell.component.html',
  'src/app/@shell/shell.component.html',
  (err) => {
    if (err) {
      fs.copyFile(
        'src/@brand/@custom/shell.component.html',
        'src/app/@shell/shell.component.html',
        (err) => {
          if (err) {
            fs.copyFile(
              'src/@brand/@default/shell.component.html',
              'src/app/@shell/shell.component.html',
              (err) => {
                if (err) {
                  console.log('Error Found:', err);
                } else {
                  console.log('File copied: shell.component.html');
                }
              }
            );
          } else {
            console.log('File copied: shell.component.html');
          }
        }
      );
    } else {
      console.log('File copied: shell.component.html');
    }
  }
);
