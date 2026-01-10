---
layout: post
title:  "Simple Spinning Animation with CSS"
date:   2020-03-18
categories: code
---

I wanted to start exploring animations using CSS so I started with this simple example and wanted to share! VSCode has a very good MDN reference and suggestions concerning different animation functions. If you want to experiment more with bezier curves, check out [cubic-bezier.com](https://cubic-bezier.com/).

Without further ado, here’s the code:

```html
<!DOCTYPE html>
<html lang="“en”">

<head>
    <meta charset="“UTF-8”" />
    <meta name="“viewport”" content="“width"="device-width," initial-scale="1.0”" />
    <title>Practicing CSS Animations</title>
    <style>
        :root {
            —-inner-color: salmon;
            —-border-color: saddlebrown;
            —-text-color: white;
        }

        body {
            padding: 200px;
        }

        .box {
            background-color: var(--inner-color);
            border: 5px solid var(--border-color);
            height: 300px;
            width: 300px;
            border-radius: 10px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
            font-size: 32px;
            color: var(--text-color);
        }

        .box:active {
            animation: spin 3s infinite;
            animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }
    </style>
</head>

<body>
    <div class="box">
        <p>Hold meee</p>
    </div>
</body>

</html>
```

Check out the result [CodePen - Spinning Box](https://codepen.io/macekovick/full/oNXypgv)