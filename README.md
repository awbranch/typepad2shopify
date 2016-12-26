# Overview

A set of scripts to convert a Typepad blog into a Shopify blog.  This includes parsing the typepad blog, downloading 
all the associated images and moving them to a new home, cleaning up css styles and uploading the blog to Shopify. 
You can use any part of the scripts you want and/or modify and extend them.

## Setup

The scripts are written in Javascript. You will need to install [Node.js](https://nodejs.org) to run them.

## read-typepad.js

Reads in a Typepad exported blog and writes it to a JSON file that is used by all the other scripts.
You can export your Typepad blog by logging into Typepad and go to Settings > Import / Export > Export. 
This will create a txt file with a format similar to the following:

	AUTHOR: xxx
	AUTHOR EMAIL: xxx
	TITLE: xxx
	STATUS: xxx
	ALLOW COMMENTS: 1
	CONVERT BREAKS: wysiwyg
	ALLOW PINGS: 0
	BASENAME: xxx
	CATEGORY: xxx
	CATEGORY: xxx
	
	UNIQUE URL:  
	DATE: 00/00/0000 00:00:00 AM
	-----
	BODY:
	xxx
	-----
	EXTENDED BODY:
	
	-----
	EXCERPT:
	
	-----
	KEYWORDS:
	
	-----
	COMMENT:
	AUTHOR: xxx
	EMAIL: xxx
	IP: 00.00.00.000
	URL: 
	DATE: 00/00/0000 00:00:00 AM
	xxx
	-----
	--------

**Example**
Read typepad.txt and write blog.json                            
         
	node read-typepad.js typepad.txt blog.json

## download-images.js

When you export your blog from Typepad it only exports the text, not the associated images. This script searches through
your posts and finds all image references inside of HTML img tags and downloads those images to a local folder. 

For 
example your blog post may contain some text like this:

	<p><a class="asset-img-link" href="http://www.myblog.com/.a/6a0523a4a8beb6670b01c8d221c4fe960c-pi" 
	style="display: inline;"><img alt="2000-01-01-11-22-33" border="0" 
	class="asset asset-image at-xid-6a0523a4a8beb6670b01c8d221c4fe960c image-full img-responsive" 
	src="http://www.myblog.com/.a/6a0523a4a8beb6670b01c8d221c4fe960c-800wi" title="2000-01-01-11-22-33" /></a></p>

This command will search the text and find the img src and download the image to a local folder. 

**Example:**
Downloads any images found in blog.json (created via read-typepad.js) and writes them to the directory MyBlogImages/ 

	node download-images.js blog.json MyBlogImages/
 
 
## remap-images.js
This script allows you to move your the images downloaded by download-images.js to another location. Unfortunately 
Shopify doesn't currently allow you to upload images to their site 
[via their API](https://ecommerce.shopify.com/c/shopify-apis-and-technology/t/upload-files-via-api-182952).
 
So you need to move the images to some new location on the internet that can be displayed in your blog, such as an 
[Amazon S3](https://aws.amazon.com/s3/) bucket or a [Dropbox public folder](https://www.dropbox.com/en/help/16) and 
then you can run this script to update all the reference img tag src locations to point to their new home. 

Additionally, this script can add file extensions onto your images. The URL's that Typepad creates for your images 
doesn't specify their file type so the file names look like "6a0523a4a8beb6670b01c8d221c4fe960c-800wi" it would be
nice to know if that was a JPG, PNF or TIFF. 

This command will update all the img src tag references in blog.json to point to your new image hosting website and
will rename the images by appending the appropriate file extension.
 
	node remap-images.js blog.json blog-new.json -extensions MyBlogImages -root http://www.myhost.com/assets/images/
 						

## clean-styles.js
This script cleans up the Typepad html and removes spurious style and class attributes. Additionally it can remove the
links that Typepad adds to images to open the images up in a new window. 

**Options:**

removeImageLinks: If specified removes the link wrappers around images. Requires that domains is also specified.
removeClasses: If specified will remove all class attributes.
removeStyles: If specified will remove all style attributes.

**Example:**

	node clean-html.js blog.json blog-new.json --removeClasses --removeStyles --removeImageLinks --domains www.foo.com www.bar.com

## write-shopify.js
This script will upload the blog that you've prepared with the other scripts to Shopify.

**First:** You must create a blog in Shopify.

**Second:** You need to get the ID for the blog. This is a unique numeric identifier for your blog. There are a couple 
ways to find it. 

Option 1: If you go to Shopify > Online Store > Blog Posts > ... > Manage Blogs > {Your Blog} you'll see the id
in the URL, for example: https://myblogname.myshopify.com/admin/blogs/12345678.

Option 2: Run the script list-blogs.js

**Third:** Get Shopify API Credentials. Before you can run this script you need to create 
[private app credentials](https://help.shopify.com/api/guides/api-credentials#generate-private-app-credentials) 
so that this script can update your blog. 


**Finally:** You can run write-shopify.js to upload your blog as follows:

**Arguments:**

- source-json: The json file containing your blog, generated via read-typepad.js
- store name:  The name of your Shopify story, you can find it in Shopify > Settings > General > Store name
- api key:     The API key associated with the private app you created above. You can find it in 
               Shopify > Apps > View private apps > API Key  
- password:    The password associated with the private app you created above. You can find it in 
               Shopify > Apps > View private apps > Password   
blog id:       The id of your blog. 


**Example:**

	node write-shopify.js blog.json mystore api-key password blog-id


## list-blogs.js
This is a script to list all the blogs on your Shopify account to help you determine your blog id.

**Arguments:**

- store name:  The name of your Shopify story, you can find it in Shopify > Settings > General > Store name
- api key:     The API key associated with the private app you created above. You can find it in 
               Shopify > Apps > View private apps > API Key  
- password:    The password associated with the private app you created above. You can find it in 
               Shopify > Apps > View private apps > Password   

**Example:**

	node list-blogs.js mystore api-key password
	


