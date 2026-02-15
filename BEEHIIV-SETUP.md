# Beehiiv Integration Setup Guide

This guide will help you connect your Beehiiv newsletter to leecorning.com.

## 🎯 What's Already Set Up

### ✅ Website Integration
- **Blog navigation** added to main site
- **Newsletter signup section** on homepage
- **Dedicated blog page** (`blog.html`) with featured posts
- **Beehiiv embed containers** ready for your publication
- **Fallback forms** for when embeds don't load
- **Analytics tracking** for newsletter signups and blog engagement

### ✅ Files Updated
- `index.html` - Added blog nav, newsletter section
- `blog.html` - Full blog page with Beehiiv embeds  
- `script.js` - Beehiiv integration and fallback handling
- `BEEHIIV-SETUP.md` - This setup guide

## 🚀 Steps to Complete Integration

### Step 1: Get Your Beehiiv Publication ID

1. **Log in to Beehiiv** at [beehiiv.com](https://beehiiv.com)
2. **Go to your publication dashboard**
3. **Navigate to Settings → Publication**
4. **Copy your Publication ID** (looks like: `pub_12345678-1234-1234-1234-123456789abc`)

### Step 2: Get Your Embed Code

1. **In Beehiiv dashboard**, go to **Audience → Embed**
2. **Choose "Inline Embed"** option
3. **Customize the styling** to match your brand:
   - Background color: `#ffffff` (white)
   - Button color: `#2563eb` (blue-600)
   - Text color: `#374151` (gray-700)
4. **Copy the embed iframe code**

### Step 3: Update Website Files

#### Update `index.html` (Homepage Newsletter Section)
Replace the placeholder iframe in the Beehiiv embed section:

```html
<!-- Find this section around line 475 -->
<iframe 
    src="https://embeds.beehiiv.com/YOUR_ACTUAL_EMBED_ID" 
    data-test-id="beehiiv-embed" 
    width="100%" 
    height="320" 
    frameborder="0" 
    scrolling="no" 
    style="border-radius: 4px; border: 2px solid #e5e7eb; margin: 0; background-color: transparent;">
</iframe>
```

#### Update `blog.html` (Blog Page Newsletter Section)
Replace the placeholder iframe in the blog page embed:

```html
<!-- Find this section around line 65 -->
<iframe 
    src="https://embeds.beehiiv.com/YOUR_ACTUAL_EMBED_ID" 
    data-test-id="beehiiv-embed" 
    width="100%" 
    height="280" 
    frameborder="0" 
    scrolling="no" 
    style="border-radius: 4px; margin: 0; background-color: transparent;">
</iframe>
```

### Step 4: Set Up API Integration (Optional)

For the fallback newsletter form to work, you'll need Beehiiv API access:

1. **In Beehiiv dashboard**, go to **Settings → API**
2. **Generate an API key** with subscription permissions
3. **Update `script.js`** around line 450:

```javascript
// Replace the placeholder values
const response = await fetch('https://api.beehiiv.com/v2/publications/YOUR_PUBLICATION_ID/subscriptions', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_ACTUAL_API_KEY',
        'Content-Type': 'application/json'
    },
    // ... rest of the code
});
```

### Step 5: Configure Webhook (Advanced)

To track newsletter signups in your analytics:

1. **In Beehiiv dashboard**, go to **Settings → Webhooks**
2. **Add webhook URL**: `https://leecorning.com/webhook/beehiiv`
3. **Select events**: `subscriber.created`, `subscriber.confirmed`
4. **Set up webhook handler** (requires backend development)

## 🎨 Customization Options

### Newsletter Embed Styling
You can customize the Beehiiv embed appearance in the dashboard:

- **Color scheme**: Match your blue-600 brand color (`#2563eb`)
- **Typography**: Use system fonts for consistency
- **Button text**: "Join 5,000+ AI Leaders" or similar
- **Success message**: "Thanks! Check your email to confirm."

### Blog Post Integration
To pull blog posts dynamically from Beehiiv:

1. **Use Beehiiv API** to fetch published posts
2. **Update JavaScript** to populate blog cards automatically
3. **Set up webhook** to update when new posts are published

## 📊 Analytics & Tracking

### Google Analytics Events
The integration already tracks:
- `newsletter_subscribe` - When someone signs up
- `beehiiv_embed_loaded` - When embed loads successfully
- `newsletter_fallback_shown` - When fallback form is used
- `blog_post_click` - When someone clicks a blog post

### Beehiiv Analytics
You can also track in Beehiiv dashboard:
- **Subscriber growth** from website embeds
- **Referring sites** to see website traffic
- **Conversion rates** by embed location

## 🔧 Testing Checklist

### ✅ Before Going Live
- [ ] **Test newsletter signup** on homepage
- [ ] **Test newsletter signup** on blog page  
- [ ] **Verify email delivery** to your inbox
- [ ] **Check mobile responsiveness** 
- [ ] **Test fallback form** (disable JavaScript temporarily)
- [ ] **Verify analytics tracking** in Google Analytics
- [ ] **Check spam folder** for test signups

### ✅ SEO Optimization
- [ ] **Update meta descriptions** to mention newsletter
- [ ] **Add schema markup** for blog posts
- [ ] **Submit sitemap** with blog.html included
- [ ] **Set up RSS feed** (if Beehiiv provides one)

## 🚀 Advanced Features (Future)

### Newsletter Archive
Create a `/newsletter` page showing past issues:
- Pull from Beehiiv API
- Display in card grid format
- Link to web versions

### Subscriber Segmentation
Tag subscribers based on website behavior:
- Blog readers vs homepage signups
- Specific post interests
- UTM parameters from referral sources

### Automated Email Sequences
Set up welcome series in Beehiiv:
- Welcome email with AI resources
- Case study examples
- Consultation booking reminders

## 📞 Support

If you need help with the integration:

1. **Check Beehiiv documentation**: [docs.beehiiv.com](https://docs.beehiiv.com)
2. **Test in browser developer tools** for JavaScript errors
3. **Review analytics** for tracking issues
4. **Contact Beehiiv support** for API or embed issues

## 🎯 Expected Results

After full integration:
- **Newsletter signups**: 5-10% of website visitors
- **Blog engagement**: 3-5 minute average reading time
- **Email list growth**: 20-30% monthly increase
- **Lead generation**: 15-20% of subscribers book consultations

---

**Ready to launch your AI newsletter empire!** 🚀