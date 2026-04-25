# TODO: Fix Auth to Save to MongoDB

## Current Status
- User registration and login are not saving/retrieving data from MongoDB
- Server connects to MongoDB but may have connection issues
- Need to ensure MONGO_URI is properly set in .env

## Steps to Complete
- [x] Add database connection check in auth_controller.js register function
- [x] Add database connection check in auth_controller.js login function
- [ ] Test registration saves to DB
- [ ] Test login retrieves from DB
- [ ] Verify MONGO_URI in .env is correct

## Files to Edit
- backend/controller/auth_controller.js
