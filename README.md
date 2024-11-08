# Swift News Search

Swift News Search is a web application designed to help users search, filter, and analyze news articles using AI-driven insights. Users can sign up and log in to access personalized features, including filtered searches and GPT-powered article analysis, while non-registered users can still view top random news of the day.

## Features
- **News Search and Filter**: Quickly search and filter news articles by keywords.
- **AI-Powered News Analysis**: For signed-in users, GPT-driven analysis provides concise insights on searched articles.
- **Account-Based Access**: Users can sign up and log in to access full functionality. Non-signed-in users can still view random top news.
- **Responsive Design**: Optimized for various screen sizes, offering a smooth experience across devices.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (>= 12.x) and npm (>= 6.x) for backend functionality.
- Web browser for frontend testing and interaction.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yohansbekele12/Swift-News-Search.git
   ```

2. **Navigate to Project Directory**:
   ```bash
   cd Swift-News-Search
   ```

3. **Install Dependencies**:
   Install required dependencies with:
   ```bash
   npm install
   ```

4. **Run the Application**:
   Start the application:
   ```bash
   nodemon index.js
   ```

5. **Access the Application**:
   Open a browser and go to `http://localhost:3000` (or the specified port) to access the news search interface.

---

## Project Structure
- **/public**: Static assets, including CSS and JavaScript files.
- **/views**: Contains `EJS` templates for rendering the frontend.
- **/routes**: API routes for handling news search, filter, and user authentication.
- **app.js**: Main application file that sets up and runs the Express server.

---

## Usage

### Account-Based Access
- **For Registered Users**: Sign up or log in to access advanced features, including filtered news searches and AI-based news analysis.
- **For Non-Registered Users**: Access top random news of the day without signing up.

### Search and Filter News
- **Search**: Enter keywords in the search bar to find relevant news.
- **Filter**: For logged-in users, apply filters based on categories, dates, or other available criteria.
- **GPT Analysis**: Analyze selected articles to get AI-powered insights on content.

---

## Technologies Used
- **Node.js** and **Express**: Backend server and routing.
- **EJS**: Templating engine for rendering dynamic HTML.
- **Authentication**: Basic user signup and login functionality.
- **GPT Integration**: AI-powered analysis for logged-in users.
- **CSS Framework** (e.g., Bootstrap or Bulma): Styling and responsive layout.
- **API Integration**: Connects to news APIs to fetch and filter articles.

---

## Future Enhancements
- **Enhanced Personalization**: Provide recommendations based on user history.
- **Saved Articles**: Allow users to bookmark articles for future reading.
- **Advanced Filtering**: Include more refined filter options, such as location or publisher.

---

## License
This project is open-source and available under the [MIT License](LICENSE).

---

