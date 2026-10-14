import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { assistantPanel } from './lib/assistantPanel'
import { ToastProvider } from './components/ui'
import { Today } from './screens/Today'

// Today loads up front; the other screens only when opened (smaller initial bundle, better on the phone).
const screen = <T extends string>(load: () => Promise<Record<T, React.ComponentType>>, name: T) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const Terminals = screen(() => import('./screens/Terminals'), 'Terminals')
const Skills = screen(() => import('./screens/Skills'), 'Skills')
const Routines = screen(() => import('./screens/Routines'), 'Routines')
const Studies = screen(() => import('./screens/Studies'), 'Studies')
const SubjectScreen = screen(() => import('./screens/Studies'), 'SubjectScreen')
const TopicScreen = screen(() => import('./screens/Studies'), 'TopicScreen')
const QuizScreen = screen(() => import('./screens/Studies'), 'QuizScreen')
const Memory = screen(() => import('./screens/Memory'), 'Memory')
const Library = screen(() => import('./screens/Library'), 'Library')
const LibraryTopicScreen = screen(() => import('./screens/Library'), 'LibraryTopicScreen')
const Receipts = screen(() => import('./screens/Receipts'), 'Receipts')
const Conversations = screen(() => import('./screens/Conversations'), 'Conversations')
const UiCatalog = screen(() => import('./screens/UiCatalog'), 'UiCatalog')
const Setup = screen(() => import('./screens/Setup'), 'Setup')
const Modules = screen(() => import('./screens/Spaces'), 'Modules')
const ModulePreview = screen(() => import('./screens/Spaces'), 'ModulePreview')
const SpaceScreen = screen(() => import('./screens/Spaces'), 'SpaceScreen')
const SpaceItemScreen = screen(() => import('./screens/Spaces'), 'SpaceItemScreen')

/** Old links and notifications to /chat: the day, with the side chat open. */
function OpenChat() {
  useEffect(() => assistantPanel.open(), [])
  return <Navigate to="/" replace state={{ keepChat: true }} />
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="setup"
            element={
              <Suspense fallback={null}>
                <Setup />
              </Suspense>
            }
          />
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            {/* The chat is the side panel now; old links and notifications open it. */}
            <Route path="chat" element={<OpenChat />} />
            <Route path="terminals" element={<Terminals />} />
            <Route path="skills" element={<Skills />} />
            <Route path="routines" element={<Routines />} />
            <Route path="studies" element={<Studies />} />
            <Route path="studies/:subject" element={<SubjectScreen />} />
            <Route path="studies/:subject/topic" element={<TopicScreen />} />
            <Route path="studies/:subject/quiz" element={<QuizScreen />} />
            <Route path="library" element={<Library />} />
            <Route path="library/:slug" element={<LibraryTopicScreen />} />
            <Route path="memory" element={<Memory />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="ui" element={<UiCatalog />} />
            <Route path="modules" element={<Modules />} />
            <Route path="modules/:id" element={<ModulePreview />} />
            <Route path="p/:slug" element={<SpaceScreen />} />
            <Route path="p/:slug/:item" element={<SpaceItemScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
